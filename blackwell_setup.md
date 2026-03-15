# ANF — Blackwell GB10 Setup Protocol

> **This document is a field report, not a tutorial.**
> Every command here was verified on a real GB10 unit after at least one failure.
> If a step has a ⚠️ warning, it means skipping it cost us hours.

**Hardware:** NVIDIA Blackwell GB10 | 120GB VRAM | aarch64 (sbsa-linux)  
**Target Model:** DeepSeek-R1-Distill-Qwen-32B (bfloat16)  
**Inference Engine:** vLLM (compiled from source)  
**OS:** Linux (aarch64)  
**Platform Note:** While this guide focuses on Blackwell, ANF is architected to run on any high-bandwidth Unified Memory architecture (Apple Silicon) or NPU-accelerated hardware.
**Last Verified:** 2025

---

## Table of Contents

1. [System Prerequisites](#1-system-prerequisites)
2. [Environment Variables — Seal First, Build Later](#2-environment-variables--seal-first-build-later)
3. [PyTorch — The CUDA 13.0 Problem](#3-pytorch--the-cuda-130-problem)
4. [vLLM — Build from Source](#4-vllm--build-from-source)
5. [Model Download](#5-model-download)
6. [Launching the vLLM Server](#6-launching-the-vllm-server)
7. [Verification — Is It Actually Working?](#7-verification--is-it-actually-working)
8. [Failure Index — What Broke and Why](#8-failure-index--what-broke-and-why)
9. [VRAM Reference Table](#9-vram-reference-table)

---

## 1. System Prerequisites

Before touching Python or vLLM, confirm the following:

```bash
# Verify GPU is visible
nvidia-smi

# Expected: Blackwell GB10, CUDA Version 13.0
# If CUDA version shows < 12.0, stop here and update drivers first.

# Verify architecture
uname -m
# Expected output: aarch64

# Verify available VRAM (should show ~120GB)
nvidia-smi --query-gpu=memory.total --format=csv
```

**Python version:**
```bash
python3 --version
# Requires: Python 3.10 or 3.11
# Python 3.12+ has known compatibility issues with some vLLM build deps
```

---

## 2. Environment Variables — Seal First, Build Later

⚠️ **Critical:** These variables must be set before any pip install or build command. Setting them after a failed build will not retroactively fix compiled binaries. Add to `~/.bashrc` or `~/.profile` for persistence.

```bash
export CUDA_HOME=/usr/local/cuda-13.0
export LD_LIBRARY_PATH=$CUDA_HOME/targets/sbsa-linux/lib:$CUDA_HOME/lib64:/usr/lib/aarch64-linux-gnu:$LD_LIBRARY_PATH
export PATH=$CUDA_HOME/bin:$PATH
```

Apply immediately without restarting:
```bash
source ~/.bashrc
```

Verify the seal:
```bash
echo $CUDA_HOME
# Expected: /usr/local/cuda-13.0

nvcc --version
# Expected: release 13.0
```

**Why sbsa-linux?**
Blackwell on aarch64 uses the SBSA (Server Base System Architecture) library path. Standard `lib64` alone is insufficient — the linker will silently fall back to CPU-only execution without raising an error.

---

## 3. PyTorch — The CUDA 13.0 Problem

⚠️ **The default PyTorch on this system is a +cpu build. It will not use the GPU at all, and will not warn you about this.**

### Step 1 — Remove the existing PyTorch installation
```bash
pip3 uninstall torch torchvision torchaudio -y
```

### Step 2 — Install CUDA 13.0 / SM_100 compatible build
```bash
pip3 install --pre torch torchvision torchaudio \
  --index-url https://download.pytorch.org/whl/nightly/cu121 \
  --break-system-packages
```

**Why cu121 and not cu130?**
As of this writing, PyTorch nightly cu130 builds are not yet stable for aarch64/sbsa. The cu121 nightly build with SM_100 support is the verified working path. This will likely change — check [PyTorch nightly status](https://pytorch.org/get-started/locally/) before running.

### Step 3 — Verify GPU is now visible to PyTorch
```bash
python3 -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0))"
# Expected:
# True
# [Blackwell GPU name]
```

If `False` is returned, the environment variables from Step 2 were not active during install. Uninstall, re-source `~/.bashrc`, reinstall.

---

## 4. vLLM — Build from Source

Pre-built vLLM wheels do not include Blackwell SM_100 support. Source compilation is mandatory.

### Step 1 — Clone vLLM
```bash
git clone https://github.com/vllm-project/vllm.git
cd vllm
```

### Step 2 — Patch pyproject.toml

⚠️ **Without this patch, the build fails silently on PEP 621 metadata validation.**

```bash
sed -i 's/license = "Apache-2.0"/license = {text = "Apache-2.0"}/g' pyproject.toml
sed -i '/license-files =/d' pyproject.toml
```

Verify the patch:
```bash
grep "license" pyproject.toml
# Expected: license = {text = "Apache-2.0"}
# The license-files line should be gone
```

### Step 3 — Set build targets

```bash
export TORCH_CUDA_ARCH_LIST="12.1"
export VLLM_TARGET_DEVICE="cuda"
```

**Why 12.1 and not 13.0?**
`TORCH_CUDA_ARCH_LIST` refers to the SM (Streaming Multiprocessor) compute capability version, not the CUDA toolkit version. Blackwell GB10's SM capability is 12.x. Setting this to "13.0" will cause the compiler to produce zero valid kernels.

### Step 4 — Compile

⚠️ **MAX_JOBS must be limited. Unlimited parallel jobs will exhaust system RAM during CUDA kernel compilation and trigger OOM Killer mid-build.**

```bash
MAX_JOBS=8 python3 setup.py build_ext --inplace
```

Expected build time: 45-90 minutes on first run.  
If the build dies silently with no error, reduce to `MAX_JOBS=4`.

### Step 5 — Install
```bash
pip3 install -e . --break-system-packages
```

---

## 5. Model Download

```bash
# Install huggingface-cli if not present
pip3 install huggingface_hub --break-system-packages

# Authenticate (required for some models)
huggingface-cli login

# Download DeepSeek-R1-Distill-Qwen-32B
huggingface-cli download deepseek-ai/DeepSeek-R1-Distill-Qwen-32B \
  --local-dir /home/nvidia/.cache/models/deepseek-r1-32b
```

**Storage requirement:** ~65GB for the 32B bfloat16 model.  
**Download time:** Varies by connection. The download is resumable — if interrupted, re-run the same command.

**Why this model and not 70B?**
See [VRAM Reference Table](#9-vram-reference-table). At bfloat16, 70B requires ~132GB. GB10 has 120GB. The OOM Killer will terminate the process at load time with no useful error message.

---

## 6. Launching the vLLM Server

### Step 1 — Pin the engine to V0

⚠️ **The V1 engine causes silent crashes during long Chain-of-Thought sequences (32K+ tokens). This is not a model issue — it reproduces consistently with any large reasoning model on this hardware.**

```bash
export VLLM_USE_V1=0
```

### Step 2 — Launch

```bash
CUDA_LAUNCH_BLOCKING=1 python3 -m vllm.entrypoints.openai.api_server \
  --model "/home/nvidia/.cache/models/deepseek-r1-32b" \
  --tensor-parallel-size 1 \
  --max-model-len 32768 \
  --dtype bfloat16 \
  --port 8000 \
  --trust-remote-code \
  --gpu-memory-utilization 0.85 \
  --enforce-eager
```

**Parameter rationale:**

| Parameter | Value | Why |
|---|---|---|
| `--tensor-parallel-size` | 1 | Single GPU setup. Increase only with verified multi-GPU NVLink. |
| `--max-model-len` | 32768 | 32K context. Higher values reduce available KV Cache space. |
| `--dtype` | bfloat16 | Native Blackwell format. float16 causes precision loss on long CoT. |
| `--gpu-memory-utilization` | 0.85 | Leaves headroom for OS process scheduler (Gnome, Xorg). At 0.95+, scheduler latency triggers vLLM health check timeouts. |
| `--enforce-eager` | flag | Disables CUDA graph capture. Slower throughput but eliminates graph-related crashes during early testing. Remove after stability is confirmed. |
| `CUDA_LAUNCH_BLOCKING=1` | env | Synchronous kernel execution. Produces actionable error messages instead of silent failures. Remove in production for performance. |

### Expected startup output
```
INFO:     Loading model weights...
INFO:     GPU blocks: XXXX, CPU blocks: XXXX
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Model load time: approximately 3-5 minutes.

---

## 7. Verification — Is It Actually Working?

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "/home/nvidia/.cache/models/deepseek-r1-32b",
    "messages": [{"role": "user", "content": "Write a Node.js function that reads a file natively."}],
    "max_tokens": 500
  }'
```

**Healthy response:** JSON with `choices[0].message.content` containing code within 10-30 seconds.  
**Timeout or connection refused:** Server did not start cleanly. Check terminal output for the specific error.

---

## 8. Failure Index — What Broke and Why

This section documents every significant failure encountered during setup. Indexed for searchability.

---

### FAIL-001 — PyTorch reports `cuda.is_available() = False`
**Symptom:** Model loads on CPU. Inference takes 10-20x longer than expected. No GPU memory usage in `nvidia-smi`.  
**Cause:** Default +cpu PyTorch build was not replaced, or environment variables were not active during install.  
**Fix:** Uninstall PyTorch, re-source `~/.bashrc`, reinstall with cu121 nightly index.

---

### FAIL-002 — vLLM build exits with `metadata-generation-failed`
**Symptom:** `pip install` or `setup.py` terminates immediately with PEP 621 metadata error.  
**Cause:** `pyproject.toml` uses deprecated `license = "Apache-2.0"` string format instead of `license = {text = "..."}` table format.  
**Fix:** Apply the sed patches in Step 4.2 before building.

---

### FAIL-003 — OOM Killer terminates build mid-compilation
**Symptom:** Build process disappears with no error. `dmesg | grep -i kill` shows OOM Killer event.  
**Cause:** Unlimited parallel CUDA kernel compilation exhausts system RAM.  
**Fix:** Set `MAX_JOBS=8` (or lower). Monitor with `htop` during first run.

---

### FAIL-004 — vLLM server crashes silently on long generation
**Symptom:** Server stops responding after 10-15 minutes of inference. No error in log. Process still running but unresponsive.  
**Cause:** V1 engine instability during long CoT sequences on Blackwell.  
**Fix:** `export VLLM_USE_V1=0` before launching server.

---

### FAIL-005 — 70B model causes immediate OOM at load time
**Symptom:** Server starts loading model weights, progress bar reaches ~90%, then process terminates. No CUDA error — just silent exit.  
**Cause:** DeepSeek-R1 70B bfloat16 requires ~132GB VRAM. GB10 has 120GB. OOM Killer fires at weight loading stage.  
**Fix:** Use 32B model. See VRAM Reference Table.

---

### FAIL-006 — vLLM health check timeout loop
**Symptom:** Server starts, logs show repeated health check failures, model reloads every few minutes.  
**Cause:** `--gpu-memory-utilization 0.95+` leaves no headroom for OS scheduler. Gnome/Xorg process spikes cause health check to miss its deadline.  
**Fix:** Set `--gpu-memory-utilization 0.85`.

---

### FAIL-007 — `ld: cannot find -lcuda` during compilation
**Symptom:** Linker error during `setup.py build_ext`.  
**Cause:** `LD_LIBRARY_PATH` does not include the sbsa-linux path specific to aarch64.  
**Fix:** Ensure `$CUDA_HOME/targets/sbsa-linux/lib` is in `LD_LIBRARY_PATH` (see Step 2).

---

## 9. VRAM Reference Table

Estimates for bfloat16 precision. Actual usage varies ±5% depending on context length and KV Cache allocation.

| Model | Parameters | VRAM (bfloat16) | GB10 Status | Notes |
|---|---|---|---|---|
| DeepSeek-R1 | 7B | ~14GB | ✅ Comfortable | Low KV Cache pressure |
| DeepSeek-R1 | 14B | ~28GB | ✅ Comfortable | Good for simple tasks |
| DeepSeek-R1 | 32B | ~64GB | ✅ **Recommended** | 56GB remaining for KV Cache |
| DeepSeek-R1 | 70B | ~132GB | ❌ OOM | Exceeds 120GB hard limit |
| DeepSeek-R1 | 671B | ~1.3TB | ❌ Not viable | Multi-node cluster required |

**Recommendation:** 32B is the optimal choice for GB10. The 56GB KV Cache headroom enables 32K context windows with room to spare, making it faster than a 70B model would be even if VRAM were sufficient.

---

## Contributing to This Document

If you reproduce these steps and find a deviation — a command that no longer works, a new failure mode, or a better solution — open a GitHub Issue with the tag `setup-protocol`. This document is a living field report, not a static tutorial.
