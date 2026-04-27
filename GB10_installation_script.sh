#!/bin/bash
# ============================================================
# ANF — Autonomous Native Forge (Industrial Setup)
# Blackwell GB10 vLLM + Nemotron-3-Super-120B + Node.js
# Versiyon: 4.2.0 | Tarih: 2026-04-27 (Nisan Güncellemesi)
# STATUS: ULTIMATE PERFORMANCE - CUDA 13.2 & cu132 NIGHTLY
# ============================================================
set -e

echo "🚀 BLACKWELL AUTONOMOUS FORGE v4.2.0 — KURULUM BAŞLIYOR"
echo "========================================================"

# --- ADIM 0: ÖNCÜL DÜZELTMELER (KRİTİK SİSTEM YAMALARI) ---
echo ">>> [0/11] Sistem kilitleri ve ortam değişkenleri mühürleniyor..."

# 1. Externally Managed Environment & Packaging Hatası Çözümü
sudo pip install --upgrade --ignore-installed packaging jsonschema --break-system-packages

# 2. Pip Önbellek İzin Düzeltmesi
sudo chown -R nvidia:nvidia /home/nvidia/.cache 2>/dev/null || true

# 3. CUDA 13.2 Ortam Değişkenleri ve Blackwell SM121 Fix
# Nisan 2026: CUDA 13.2 ile Blackwell Ultra desteği mühürlenmiştir.
export CUDA_HOME="/usr/local/cuda-13.2"
export PATH="$CUDA_HOME/bin:$PATH"
export LD_LIBRARY_PATH="$CUDA_HOME/lib64:$LD_LIBRARY_PATH"
# Blackwell ptxas (FP4/NVFP4) kernel'larını optimize derler
export TORCH_CUDA_ARCH_LIST="9.0 10.0 12.0 12.1"

# --- SABİTLER (Nemotron-3-Super-120B-A12B + April 2026 Update) ---
VLLM_DIR="/home/nvidia/vllm"
MODEL_ID="nvidia/Nemotron-3-Super-120B-A12B"
MODEL_DIR="/home/nvidia/.cache/models/nemotron-super-120b"
PYTHON_VER="3.12"
SITE_PACKAGES="/usr/local/lib/python${PYTHON_VER}/dist-packages"
NCCL_PRELOAD="${SITE_PACKAGES}/nvidia/nccl/lib/libnccl.so.2"
LD_LIB="${SITE_PACKAGES}/torch/lib:${SITE_PACKAGES}/nvidia/nccl/lib:${CUDA_HOME}/targets/sbsa-linux/lib:${CUDA_HOME}/lib64"

# KRİTİK: PATH mühürleme
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/cuda-13.2/bin:$HOME/.local/bin:$PATH"

# --- ADIM 1: SİSTEM BAĞIMLILIKLARI VE NODE.JS ---
echo ">>> [1/11] OS Paketleri ve Node.js v22..."
echo "⏳ Paket kilidi kontrol ediliyor..."
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || ps aux | grep -v grep | grep -E "apt-get|dpkg" >/dev/null 2>&1; do
    echo "⏳ Paket yöneticisi meşgul, bekliyoruz (5sn)..."
    sleep 5
done

sudo apt-get update -qq && sudo apt-get install -y libnuma-dev curl binutils git python3-pip python3-dev build-essential
if ! node -v | grep -q "v22" 2>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
fi
echo "✅ Sistem paketleri ve Node.js hazır."

# --- ADIM 2: vLLM KAYNAK KODUNUN ÇEKİLMESİ ---
echo ">>> [2/11] vLLM Kaynak Kodu GitHub'dan çekiliyor..."
if [ ! -d "$VLLM_DIR" ]; then
    git clone https://github.com/vllm-project/vllm.git "$VLLM_DIR"
    sudo chown -R nvidia:nvidia "$VLLM_DIR"
    cd "$VLLM_DIR" && git checkout main
else
    echo "✅ vLLM dizini mevcut. Güncelleniyor..."
    cd "$VLLM_DIR" && git checkout . && git checkout main && git pull origin main
fi

# --- ADIM 3: MODEL OTOMATİK İNDİRME (NEMOTRON-3-SUPER) ---
echo ">>> [3/11] Nemotron-3-Super-120B-A12B ağırlıkları indiriliyor (~86GB)..."
sudo pip3 install --upgrade "huggingface_hub[cli]" nvidia-nccl-cu132 --break-system-packages

if [ ! -d "$MODEL_DIR" ] || [ -z "$(ls -A "$MODEL_DIR" 2>/dev/null)" ]; then
    hash -r 2>/dev/null
    echo "🚀 HuggingFace CLI ile model indirme başlıyor (UD-Q4_K_XL)..."
    huggingface-cli download $MODEL_ID \
        --local-dir "$MODEL_DIR" \
        --include "*UD-Q4_K_XL*" \
        --local-dir-use-symlinks False
else
    echo "✅ Model dizini mevcut ve dolu görünüyor."
fi

# --- ADIM 4: TEMİZLİK ---
echo ">>> [4/11] Eski derleme kalıntıları temizleniyor..."
cd "$VLLM_DIR"
sudo rm -rf build/ vllm.egg-info/
sudo find . -name "*.so" -delete
sudo pip3 uninstall vllm torch torchvision torchaudio -y --break-system-packages 2>/dev/null || true
sudo pip3 cache purge

# --- ADIM 5: PYTORCH CU132 (NİSAN 2026 EN GÜNCEL) ---
echo ">>> [5/11] PyTorch cu132 Nightly (Blackwell Ultra Optimize) yükleniyor..."
# cu132 desteği en yeni SM121 (Blackwell) donanım ivmelenmesini sağlar
sudo pip3 install --pre torch torchvision torchaudio \
  --index-url https://download.pytorch.org/whl/nightly/cu132 \
  --break-system-packages

pip3 list | grep torch | awk '{print $1"==" $2}' > /tmp/torch_constraints.txt

sudo pip3 install setuptools==77.0.3 "numpy<2.3" setuptools_scm cmake ninja wheel \
  -c /tmp/torch_constraints.txt --break-system-packages

if [ -d "requirements" ]; then
    for req_file in requirements/*.txt; do
        grep -vE "torch|torchvision|torchaudio" "$req_file" > "${req_file}.tmp"
        sudo pip3 install -r "${req_file}.tmp" -c /tmp/torch_constraints.txt --break-system-packages || true
    done
else
    sudo pip3 install uvloop fastapi uvicorn pydantic openai requests sentencepiece "numpy<2.3" --break-system-packages
fi

echo ">>> FlashInfer (v0.7.1+) SM100 kernel yamasıyla derleniyor..."
sudo pip3 install git+https://github.com/flashinfer-ai/flashinfer.git \
  -c /tmp/torch_constraints.txt --break-system-packages || echo "⚠️ FlashInfer atlandı."

# --- ADIM 6: ÇEVRESEL DEĞİŞKENLER VE YAMA ---
echo ">>> [6/11] pyproject.toml ve Performans Flagleri..."
export CUDA_HOME="$CUDA_HOME"
export TORCH_CUDA_ARCH_LIST="12.1"
export VLLM_TARGET_DEVICE="cuda"
export VLLM_ATTENTION_BACKEND=FLASH_ATTN
# Blackwell FP4 Marlin Backend Etkinleştirme (Nisan 2026 Güncellemesi)
export VLLM_NVFP4_GEMM_BACKEND="marlin" 
export LD_LIBRARY_PATH="$LD_LIB:$LD_LIBRARY_PATH"

sed -i 's/license = "Apache-2.0"/license = {text = "Apache-2.0"}/g' pyproject.toml 2>/dev/null || true
sed -i '/license-files =/d' pyproject.toml 2>/dev/null || true

# --- ADIM 7: vLLM ABI FIX DERLEME ---
echo ">>> [7/11] vLLM izolasyonsuz derleniyor (ABI Fix)..."
sudo -E env \
  VLLM_VERSION_OVERRIDE="0.18.1rc1.dev" \
  LD_PRELOAD="$NCCL_PRELOAD" \
  LD_LIBRARY_PATH="$LD_LIB" \
  MAX_JOBS=8 \
  pip3 install -e . --no-deps --no-build-isolation --break-system-packages

# --- ADIM 8: DOĞRULAMA ---
echo ">>> [8/11] ABI Doğrulanıyor..."
nm -D "$VLLM_DIR/vllm/_C.abi3.so" 2>/dev/null | grep MessageLogger && echo "✅ ABI Tamam."

# --- ADIM 9: SYSTEMD SERVİSİ (MAX PERFORMANS) ---
echo ">>> [9/11] Nemotron-Super Servisi mühürleniyor..."
sudo bash -c "cat > /etc/systemd/system/vllm-nemotron.service << EOF
[Unit]
Description=vLLM Nemotron-Super Blackwell Service
After=network.target

[Service]
Type=simple
User=nvidia
WorkingDirectory=$VLLM_DIR
Environment=\"PYTHONPATH=$VLLM_DIR\"
Environment=\"VLLM_USE_V1=0\"
Environment=\"VLLM_TARGET_DEVICE=cuda\"
Environment=\"VLLM_NVFP4_GEMM_BACKEND=marlin\"
Environment=\"VLLM_ALLOW_LONG_MAX_MODEL_LEN=1\"
Environment=\"LD_PRELOAD=${NCCL_PRELOAD}\"
Environment=\"LD_LIBRARY_PATH=${LD_LIB}\"
ExecStart=/usr/bin/python3 -m vllm.entrypoints.openai.api_server \\
    --model $MODEL_DIR \\
    --served-model-name nemotron-super \\
    --tensor-parallel-size 1 \\
    --max-model-len 131072 \\
    --dtype bfloat16 \\
    --port 8000 \\
    --trust-remote-code \\
    --gpu-memory-utilization 0.90 \\
    --enforce-eager
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

# --- ADIM 10: ATEŞLEME ---
echo ">>> [10/11] Nemotron-Super servisi başlatılıyor..."
sudo systemctl daemon-reload && sudo systemctl restart vllm-nemotron

# --- ADIM 11: HEALTH CHECK ---
echo ">>> [11/11] API Hazır Olması Bekleniyor..."
READY=0
for i in $(seq 1 120); do 
  if curl -s http://localhost:8000/v1/models | grep -q "nemotron-super"; then
    echo -e "\n✅ BAŞARI: Nemotron-3-Super Online (FP4 Marlin Mode)!"
    READY=1
    break
  fi
  echo -n "." && sleep 10
done

if [ $READY -eq 0 ]; then
    echo -e "\n❌ HATA: Servis zaman aşımına uğradı. Günlükleri kontrol et: sudo journalctl -u vllm-nemotron -f"
    exit 1
fi

echo "=================================================="
echo "✅ ANF FABRİKA KALBİ (NEMOTRON-SUPER) HAZIR"
echo "✅ KONFİGÜRASYON: CUDA 13.2 | cu132 | MARLIN FP4"
echo "=================================================="
