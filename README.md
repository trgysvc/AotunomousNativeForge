# ANF — Autonomous Native Forge

> *Drop a PRD. Get working software. See what happens in between.*

[![Node.js v22+](https://img.shields.io/badge/Node.js-v22%2B-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardware](https://img.shields.io/badge/Hardware-GB10%20Blackwell%20%7C%20ASUS%20Ascent-76B900)](https://www.nvidia.com)
[![Status](https://img.shields.io/badge/Status-V4.5%20Active-brightgreen)]()

**Autonomous Native Forge** is a 4-agent software factory that reads technical documents (PRD, Sprint, Spec) and produces working software. It runs **entirely locally** and has **zero npm dependencies**.

- No cloud. No vendor lock-in. No mandatory API keys.
- Pure Node.js. Only `node:http`, `node:fs`, `node:path`, `node:events`.
- Every LLM error, every retry, and every steering decision is recorded in `DEVLOG.md`.

---

## Quick Start

```bash
# 1. Verify NIM/LLM connection
npm run test-nim

# 2. Start the factory (spawns all 4 agents)
npm run forge

# 3. Open the dashboard in another terminal
npm run dashboard
# → http://localhost:3000 (auto-refreshes every 5 seconds)

# 4. Drop your project's PRD → Architect will discover it automatically
mkdir -p docs/reference/YOUR_PROJECT_NAME
# Place your prd.md file there

# Alternative: Read from an external directory (vault.json > reference_dir)
# Add this line to vault.json: "reference_dir": "/external/path/docs/reference"
```

---

## Which LLM Works?

ANF uses the **OpenAI-compatible** `/v1/chat/completions` API. Thinking formats are automatically cleaned.

### GB10 (128GB) — Why Nemotron?

| Metric | Nemotron-3-Super-120B | GLM-4-32B | Llama-Nemotron-49B |
|---|---|---|---|
| **PinchBench** (agentic coding) | **85.6%** | — | — |
| SWE-bench | 60.5% | Very strong | Strong |
| Speed | **~329 tok/s** | ~200 tok/s | ~150 tok/s |
| Active parameters (MoE) | **12B** | 32B (dense) | 49B (dense) |
| Context window | **1M tokens** | 32K | 128K |
| Reasoning budget control | **✅ per-call** | ✅ | ❌ |
| 128GB usage | ~60GB weights + 68GB KV | ~64GB + 64GB | ~98GB + 30GB |

> **Difference between PinchBench vs SWE-bench:** SWE-bench measures one-time code generation. PinchBench measures the ability of an agent to sit down and solve a real project — which is exactly what ANF does.

> **Reasoning budget:** In every agent call, we tell the LLM how many tokens it should "think." Architect gets 16384, Coder 4096, and Tester only 256. This optimizes both quality and speed.

### Other Platforms

| Platform | Model | Port | Timeout |
|---|---|---|---|
| Ollama (macOS/Linux) | `deepseek-r1:7b`, `llama3.2`, `qwen2.5-coder:7b` | 11434 | 2min |
| LM Studio | any | 1234 | 5min |
| NVIDIA NIM Cloud | `nvidia/nemotron-3-super-120b-a12b` | 443 (https) | 2min |
| OpenAI API | `gpt-4o` | 443 (https) | 2min |

### Configuration — `config/vault.json`

```json
{
  "global": {
    "nim_host": "localhost",
    "nim_port": 8000,
    "nim_protocol": "http",
    "nim_api_key": "",
    "model_id": "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4",
    "nim_timeout_ms": 300000,
    "nim_enable_thinking": true,
    "nim_reasoning_budgets": {
      "ARCHITECT": 16384,
      "REVIEWER_COST": 2048,
      "REVIEWER_PERF": 2048,
      "CODER": 4096,
      "TESTER": 256,
      "DOCS": 1024
    },
    "reference_dir": "/optional/external/docs/reference",
    "workspace_dir": "/optional/external/src",
    "researcher_enabled": true,
    "dashboard_port": 3000,
    "webhooks": {
      "urls": [],
      "events": ["TASK_FAILED", "SPRINT_COMPLETE", "PR_OPENED"]
    },
    "concurrency": {
      "ARCHITECT": 1,
      "CODER": 3,
      "TESTER": 2,
      "DOCS": 2
    }
  }
}
```

| Field | Description |
|---|---|
| `nim_enable_thinking` | `false` → disables thinking (use for fast JSON models) |
| `reference_dir` | Root for reading PRDs. If an external path is given, files are read-only and tracked via manifest |
| `workspace_dir` | Root for writing generated code. Defaults to `src/` |
| `researcher_enabled` | Set to `false` to skip URL fetching (for fully offline environments) |
| `dashboard_port` | Web dashboard port. Start with `node dashboard/server.js` |
| `webhooks.urls` | If empty, webhooks are disabled. Add endpoints to receive POST requests on pipeline events |
| `webhooks.events` | Supports `TASK_DONE`, `TASK_FAILED`, `SPRINT_COMPLETE`, `PR_OPENED` |
| `concurrency` | Concurrent task limit for each agent. ARCHITECT=1 is required |

### vLLM Serve Commands

**Nemotron-3-Super-120B-NVFP4 (Recommended):**
```bash
# GB10 128GB — NVFP4 (~60GB) + FP8 KV cache + 65K context
vllm serve nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4 \
  --quantization nvfp4 \
  --kv-cache-dtype fp8 \
  --max-model-len 65536 \
  --gpu-memory-utilization 0.95 \
  --reasoning-parser nemotron_v3 \
  --enable-auto-tool-choice \
  --port 8000

# For 1M context (experimental, requires more KV cache):
# VLLM_ALLOW_LONG_MAX_MODEL_LEN=1 vllm serve ... --max-model-len 1048576
```

**GLM-4-32B-0414 (Alternative, fastest small model):**
```bash
vllm serve THUDM/GLM-4-32B-0414 \
  --dtype bfloat16 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.55 \
  --enable-auto-tool-choice \
  --port 8000
```

Refer to `config/vault.example.json` for all options.

---

## Pipeline — Step-by-Step

```
docs/reference/{project_id}/prd.md
          │
          │  [Architect scans every 60 seconds]
          ▼
┌─────────────────────────────────────────────────────┐
│  RESEARCHER  —  External Resource Scanner (Optional)│
│  1. Extracts https:// URLs from the PRD             │
│  2. Fetches them all in parallel (15s timeout)      │
│  3. HTML strip → returns as context block           │
└──────────────────────────┬──────────────────────────┘
                           │ researchContext
                           ▼
┌─────────────────────────────────────────────────────┐
│  ARCHITECT  —  Consensus Planning                   │
│  Phase 1: Multi-Doc Synthesis (combinedContent      │
│           + researchContext → NIM → task JSON)      │
│  Phase 2: Peer Review (Cost-Reviewer × Perf)        │
│  Phase 3: Synthesis (performance-weighted plan)     │
│  Phase 4: Stack Rules (PRD → manifest.stack_rules)  │
│  → Creates manifest.json, queues for sprint         │
└──────────────────────────┬──────────────────────────┘
                           │ WRITE_CODE × N (Parallel, vault.concurrency)
                    ┌──────┴──────┐
                    ▼             ▼
┌──────────────┐  ┌──────────────┐
│  CODER  #1   │  │  CODER  #2   │   (Max 3 concurrent)
│ Active Recall│  │ Context Inj. │
│ LANG_MAP     │  │ LANG_MAP     │
└──────┬───────┘  └──────┬───────┘
       └────────┬─────────┘
                │ CODE_FINISHED
                ▼
┌─────────────────────────────────────────────────────┐
│  TESTER  —  5-Layer Quality Gate                    │
│  1. Native Syntax Check (node --check / tsc)        │
│  2. Docker Sandbox (--network none, read-only mount)│
│  3. Governance Guardrails (manifest.stack_rules)    │
│  4. Shadow Tester (secret / eval() / ReDoS)         │
│  5. AI Review (PRD compliance check)                │
└──────────────────────────┬──────────────────────────┘
                           │
               ┌────────────┴────────────┐
               │ TEST_PASSED             │ BUG_REPORT
               ▼                         ▼
   ┌───────────────────────┐   ┌───────────────────────┐
   │  ensureBranch         │   │  ARCHITECT Steering   │
   │  pushToGithub         │   │  Retry ≤ 3            │
   │  (feature/sprint-sN)  │   │  3+ → FAILED + RCA.md │
   │  DONE → DOCS          │   │  notify(TASK_FAILED)  │
   │  checkSprintCompletion│   └───────────────────────┘
   │  → PR opened          │
   │  notify(SPRINT/PR)    │
   └──────────┬────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│  DOCS  —  Archivist                                 │
│  1. Generates technical module documentation        │
│  2. Adds timestamped entry to DEVLOG.md             │
│  3. Updates SYSTEM_STATE.md (technical debt)        │
└─────────────────────────────────────────────────────┘

         [Anytime] http://localhost:3000 — Web Dashboard
                  (manifest.json + sys.log → 5s refresh)
```

**Messaging:** Every agent reads JSON files in the `queue/inbox/{agent}/` folder every 5 seconds. Crash-safe: orphan tasks are recovered via bootstrap. PROCESSING files are in `{agentName}-{file}` format — ensuring no two processes take the same task.

---

## V4.5 — New Features

### Sprint Branch Workflow & Autonomous PR
After each task passes testing, it is pushed to a branch like `feature/sprint-s0`, `feature/sprint-s1`. When all tasks in a sprint are DONE, ANF automatically opens a PR to `main`. GitHub config is optional — if `src/{project_id}/config.json` is missing, all Git operations are silently skipped.

```json
// src/{project_id}/config.json (gitignored)
{ "github": { "token": "ghp_...", "repo": "https://github.com/owner/repo.git" } }
```

### Parallel Coder
Independent tasks are now processed concurrently. `vault.concurrency.CODER = 3` → 3 NIM API calls fly at the same time. ARCHITECT = 1 (to prevent manifest race conditions). `fs.renameSync` is used for atomic claims — no two processes can take the same task.

### Docker Sandbox
Tester's Step 2: code is executed in an isolated Alpine container. `--network none` — no external API calls can be made during testing. If Docker is missing or the project language isn't supported, it is silently skipped.

### Webhook Notifications
Add an endpoint to `vault.json > webhooks.urls` → receive HTTP POST requests on pipeline events:

| Event | When |
|---|---|
| `TASK_FAILED` | When MAX_RETRIES is exceeded |
| `SPRINT_COMPLETE` | When all tasks in a sprint are DONE |
| `PR_OPENED` | When a GitHub PR is successfully created |
| `TASK_DONE` | When each task is completed (opt-in, disabled by default) |

### Researcher Agent
Architect automatically fetches `https://` URLs within the PRD before planning. This ensures that API references, SDK documentation, and changelogs are included in the plan — so the model doesn't have to rely on outdated training data.

### Web Dashboard
```bash
npm run dashboard # http://localhost:3000
```
Sprint progress bars for each project, color-coded task statuses, live counters, and an auto-updating log panel. Zero external dependencies — native `node:http`.

---

## Agent Files and Their Roles

| Agent / Module | Code File | Skill/Prompt | Role |
|---|---|---|---|
| **Architect** | `agents/architect.js` | `agents/architect.md` | Orchestrator: synthesis, consensus, sprint gate, steering |
| **Coder** | `agents/coder.js` | `agents/coder.md` | Code generator: active recall, context injection, LANG_MAP |
| **Tester** | `agents/tester.js` | `agents/tester.md` | 5-layer quality gate: syntax → sandbox → guardrail → security → AI |
| **Docs** | `agents/docs.js` | `agents/docs.md` | DEVLOG + SYSTEM_STATE archivist |
| **Reviewer Cost** | *(within architect)* | `agents/reviewer_cost.md` | Redundant step detection, advocate for simplicity |
| **Reviewer Perf** | *(within architect)* | `agents/reviewer_perf.md` | Bottleneck detection, <2s response rule |
| **Security Guard** | `agents/security_guardrail.js` | *(hardcoded rules)* | Secret, eval(), ReDoS, SDK ban |
| **Docker Sandbox** | `agents/docker_sandbox.js` | — | Isolated test environment (Alpine, --network none) |
| **Notifier** | `agents/notifier.js` | — | Webhook dispatcher: 4 event types, parallel POST |
| **Researcher** | `agents/researcher.js` | — | PRD URL fetch, HTML strip, context injection |
| **Dashboard** | `dashboard/server.js` | — | Web UI: manifest + log → http://localhost:3000 |

Each agent reads its own `.md` skill file at startup and sends it to NIM as a system prompt. This way, the LLM knows "who it is" and "what it should do" in every call.

---

## Is Runtime Optimization Necessary?

### No (Automated)
- Agent coordination is automatic (manifest + sprint gate)
- Retry logic (max 3) is built-in and operational
- Security guardrail is static regex, zero latency
- Crash recovery (orphan tasks) handled at bootstrap

### Yes (Pay attention to these)

**Token Limit** — `agents/architect.js:TOKEN_LIMIT = 50000`

With Nemotron's 1M context and vLLM's `--max-model-len 65536` setting, 50K tokens are processed safely. Projects exceeding the limit are marked with the `_overlimit_` prefix to prevent infinite loops.

```js
// agents/architect.js, line 13
const TOKEN_LIMIT = 50000; // Safe limit for Nemotron NVFP4
```

**Timeout** — `config/vault.json:nim_timeout_ms`

| Model | Recommended Timeout |
|---|---|
| Nemotron-3-Super-120B-NVFP4 (GB10) | 300000 (5min) — MoE, 12B active params |
| GLM-4-32B (GB10) | 120000 (2min) |
| DeepSeek-R1-7B (Ollama) | 300000 (5min) |
| GPT-4o (OpenAI) | 120000 (2min) |

**vLLM Settings (GB10) — Nemotron NVFP4**

```bash
vllm serve nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4 \
  --quantization nvfp4 \
  --kv-cache-dtype fp8 \
  --max-model-len 65536 \
  --gpu-memory-utilization 0.92 \
  --reasoning-parser nemotron_v3 \
  --enable-auto-tool-choice \
  --port 8000
```

- `--quantization nvfp4` + `--kv-cache-dtype fp8` → ~60GB model, 68GB KV cache
- `--reasoning-parser nemotron_v3` → thinking is separated into `reasoning_content`, `content` is clean
- DO NOT USE `--enforce-eager` — it disables CUDA graphs, resulting in 2-3x throughput loss

---

## Project Structure

```
AutonomousNativeForge/
│
├── agents/                    # All agent source code
│   ├── bootstrap.js           # Factory ignition — entry point
│   ├── base-agent.js          # NIM API, queue, GitHub, parallel start(), utils
│   ├── architect.js           # Orchestrator: synthesis, consensus, sprint gate
│   ├── coder.js               # Code generator: active recall, context injection
│   ├── tester.js              # 5-layer QA: syntax→sandbox→guardrail→sec→AI
│   ├── docs.js                # DEVLOG + SYSTEM_STATE archivist
│   ├── security_guardrail.js  # Static regex security scanner
│   ├── docker_sandbox.js      # Isolated test environment (Alpine, --network none) [V4.5]
│   ├── notifier.js            # Webhook dispatcher (4 event types)           [V4.5]
│   ├── researcher.js          # PRD URL fetch + HTML strip + context inj.    [V4.5]
│   │
│   ├── architect.md           # Architect system prompt (skill)
│   ├── coder.md               # Coder system prompt (skill)
│   ├── tester.md              # Tester system prompt (skill)
│   ├── docs.md                # Docs system prompt (skill)
│   ├── reviewer_cost.md       # Cost reviewer prompt (consensus)
│   └── reviewer_perf.md       # Perf reviewer prompt (consensus)
│
├── dashboard/
│   └── server.js              # Web UI: /api/status + /api/logs [V4.5]
│
├── core/
│   └── agentBus.js            # EventEmitter infrastructure (future development)
│
├── config/
│   ├── vault.json             # LLM endpoint + all config [gitignored]
│   └── vault.example.json     # Reference template
│
├── docs/
│   └── reference/             # ← Drop your PRDs here
│       └── {project_id}/
│           └── *.md
│
├── src/                       # Agent outputs — generated code
│   └── {project_id}/
│       ├── manifest.json      # Task status + stack_rules (pipeline state)
│       ├── config.json        # GitHub token + repo URL [gitignored, optional]
│       ├── SYSTEM_STATE.md    # Technical debt + feature map
│       └── {generated code}
│
├── queue/                     # Agent messaging system
│   ├── inbox/{agent}/         # Incoming tasks (JSON)
│   ├── processing/            # In-progress: {agentName}-{file} format
│   ├── done/                  # Completed
│   └── error/                 # Failures with {task_id}_RCA.md
│
├── sys.log                    # All agent logs (read by dashboard)
├── common_lessons.json        # Global active recall (for all projects)
│
└── scripts/
    ├── status.js              # Pipeline status monitor (CLI)
    └── test-nim-connection.js # LLM connection + inference test
```

---

## Commands

```bash
npm run forge       # Start the factory (all agents)
npm run architect   # Start only the architect (single project test)
npm run dashboard   # Web dashboard → http://localhost:3000
npm run status      # Pipeline status — snapshot (CLI)
npm run watch       # Pipeline status — updates every 3s (CLI)
npm run test-nim    # LLM connection + single-token inference test
```

---

## PRD Format Guide

Architect looks for the following:

```markdown
# Project Title

## Sprint Plan

### S0-1: Module Name
**File:** `apps/server/index.js`

Explain what to do here...

**Dependencies:** None  ← or a task_id like S0-2
```

**Rules:**
- Task IDs should be in the format `S0-1`, `S0-1.1`, `S1-2` (Sprint-No.Sub-No)
- `file_path` must have an extension: `.js`, `.ts`, `.tsx`, `.sql`, `.md`, `.yml`
- File paths should start with `apps/` or `packages/` (monorepo standard)
- Total tokens should be < 50,000 (Safe limit for Nemotron; split if exceeded)

---

## What Happens When the System Starts?

`npm run forge` → `node agents/bootstrap.js` executes:

```
[BOOTSTRAP] Building folder hierarchy...
[BOOTSTRAP] Recovering orphan tasks (Recovery)...
[BOOTSTRAP] Sealing project credentials...
[BOOTSTRAP] Verifying agent files...
[BOOTSTRAP] Waiting for vLLM (http://localhost:8000)...
[BOOTSTRAP] ✅ vLLM Ready!
[BOOTSTRAP] 🚀 Launching agents...
  + [ARCHITECT] macOS Terminal started.
  + [CODER]     macOS Terminal started.
  + [TESTER]    macOS Terminal started.
  + [DOCS]      macOS Terminal started.
```

Then:
1. Each agent starts in its own Terminal window (macOS) or as a systemd service (Linux/GB10)
2. Architect scans `docs/reference/` every 60 seconds
3. Upon finding a new PRD → Synthesis → Manifest → Sends the first task to Coder
4. Pipeline flows automatically: Coder → Tester → [Retry or GitHub Push] → Docs
5. Monitor in real-time with `npm run watch`

**Note:** `bootstrap.js` will not start agents until vLLM is ready. It waits in an infinite loop. On GB10 cold starts, vLLM loading can take 2-5 minutes.

---

## Hardware Support

| Platform | Status | Model | Notes |
|---|---|---|---|
| **NVIDIA GB10 Blackwell** | ✅ Active | Nemotron-3-Super-120B-NVFP4 | vLLM + CUDA 13.2 + cu132 nightly PyTorch |
| **ASUS Ascent GX10** | ✅ Same hw | Same | GB10 Superchip, 128GB unified mem |
| **Apple Silicon** | ✅ Works | Ollama (llama3, deepseek-r1:7b) | MLX backend roadmap |
| **Any Linux x86** | ✅ Works | Ollama or vLLM | GPU optional |

GB10 installation script: `./GB10_installation_script.sh` (v4.3.0 — NVFP4 + FP8 KV + Marlin)

Detailed GB10 guide: `docs/GB10 system installation procedures/`

---

## Security Rules

`security_guardrail.js` automatically blocks the following:

| Rule | Severity | Example |
|---|---|---|
| Hardcoded secret | CRITICAL | `apiKey = "sk-abc..."` |
| eval() usage | CRITICAL | `eval(userInput)` |
| ReDoS regex | HIGH | `/.*/+/` |
| Direct shell exec | MEDIUM | `child_process.exec(...)` |
| openai SDK | CRITICAL | `require('openai')` |
| @nvidia/* SDK | CRITICAL | `require('@nvidia/nim')` |

---

## Roadmap

**V4.0 → V4.5 (Completed)**
- [x] 4-agent pipeline (Architect, Coder, Tester, Docs)
- [x] File-based crash-safe message queue
- [x] Active Recall — contextual injection of error lessons
- [x] Shadow Tester — static security scanning (secret, eval, ReDoS)
- [x] Peer Review Consensus — Cost × Performance dialectic
- [x] SYSTEM_STATE.md — technical debt tracking
- [x] vLLM + Nemotron-3-Super-120B-NVFP4 stable on GB10 (CUDA 13.2, NVFP4, FP8 KV)
- [x] External `reference_dir` support (read-only, manifest-based reprocessing protection)
- [x] Agent skill files synchronized with current system behavior
- [x] Generic PRD support — all project types supported via manifest.stack_rules
- [x] Context File Injection — Coder writes by reading dependent files
- [x] Sprint Branch Git integration — each sprint pushed to `feature/sprint-sN`
- [x] Autonomous PR opening — GitHub PR created when sprint completes
- [x] Docker Sandbox — `--network none` isolated test environment
- [x] Webhook notification system — 4 event types, parallel POST, non-fatal
- [x] Parallel Coder — simultaneous task support via vault.concurrency
- [x] Orphan recovery bug fixed (correct matching with PROCESSING prefix)
- [x] Researcher agent — external resource enrichment via PRD URL fetch
- [x] Web Dashboard — `http://localhost:3000`, 5s refresh, dark theme

**In Progress / Planned**
- [ ] Step 11: Multi-file task — single task generating multiple files
- [ ] Step 12: Diff/patch update — generate patch instead of entire file during STEER
- [ ] Step 13: Knowledge graph — semantic lesson linkage (embedding instead of keyword)
- [ ] ASUS Ascent NPU inference adapter (awaiting May 2026 drivers)
- [ ] Apple Silicon MLX backend
- [ ] Autonomous Refactoring Sprint (eliminating technical debt)

---

## Author

**Turgay Savacı** — Software Developer, 15+ years in IT, last 5 years in software engineering.

*Cloud is convenient. Local is free.*
�� Çalışır | Ollama veya vLLM | GPU opsiyonel |

GB10 kurulum scripti: `./GB10_installation_script.sh` (v4.3.0 — NVFP4 + FP8 KV + Marlin)

GB10 detaylı rehber: `docs/GB10 system installation procedures/`

---

## Güvenlik Kuralları

`security_guardrail.js` şunları otomatik engeller:

| Kural | Şiddet | Örnek |
|---|---|---|
| Hardcoded secret | CRITICAL | `apiKey = "sk-abc..."` |
| eval() kullanımı | CRITICAL | `eval(userInput)` |
| ReDoS regex | HIGH | `/.*/+/` |
| Doğrudan shell exec | MEDIUM | `child_process.exec(...)` |
| openai SDK | CRITICAL | `require('openai')` |
| @nvidia/* SDK | CRITICAL | `require('@nvidia/nim')` |

---

## Roadmap

**V4.0 → V4.5 (Tamamlandı)**
- [x] 4-agent pipeline (Architect, Coder, Tester, Docs)
- [x] Dosya tabanlı crash-safe mesaj kuyruğu
- [x] Active Recall — hata derslerini bağlamsal enjekte etme
- [x] Shadow Tester — statik güvenlik taraması (secret, eval, ReDoS)
- [x] Peer Review Consensus — Cost × Performance diyalektiği
- [x] SYSTEM_STATE.md — teknik borç takibi
- [x] vLLM + Nemotron-3-Super-120B-NVFP4 GB10 kararlı (CUDA 13.2, NVFP4, FP8 KV)
- [x] Harici `reference_dir` desteği (salt okunur, manifest ile tekrar işleme koruması)
- [x] Agent skill dosyaları güncel sistem davranışıyla senkronize
- [x] Generic PRD desteği — manifest.stack_rules ile her proje tipi desteklenir
- [x] Context File Injection — Coder bağımlı dosyaları okuyarak yazar
- [x] Sprint Branch Git entegrasyonu — her sprint `feature/sprint-sN`'a push edilir
- [x] Otonom PR açma — sprint tamamlandığında GitHub PR oluşturulur
- [x] Docker Sandbox — `--network none` izole test ortamı
- [x] Webhook bildirim sistemi — 4 event tipi, paralel POST, non-fatal
- [x] Paralel Coder — vault.concurrency ile eş zamanlı görev desteği
- [x] Orphan recovery bug düzeltildi (PROCESSING prefix ile doğru eşleşme)
- [x] Researcher agent — PRD URL fetch ile dış kaynak zenginleştirmesi
- [x] Web Dashboard — `http://localhost:3000`, 5s refresh, dark theme

**Devam Eden / Planlanan**
- [ ] Step 11: Multi-file task — tek görev birden fazla dosya üretsin
- [ ] Step 12: Diff/patch update — STEER sırasında tüm dosya yerine patch üret
- [ ] Step 13: Knowledge graph — semantik lesson linkage (keyword yerine embedding)
- [ ] ASUS Ascent NPU inference adaptörü (Mayıs 2026 driver bekleniyor)
- [ ] Apple Silicon MLX backend
- [ ] Otonom Refactoring Sprint (teknik borç silme)

---

## Yazar

**Turgay Savacı** — Yazılım Geliştirici, 15+ yıl IT, son 5 yılı yazılım mühendisliğinde.

*Bulut kullanışlıdır. Yerel olan özgürdür.*
