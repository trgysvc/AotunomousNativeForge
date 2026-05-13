# ANF INTERNAL SYSTEM DOCUMENTATION: SOVEREIGN PROTOCOL

## 🛡️ What is Sovereignty?
ANF is not just a coding tool; it is a sovereign system capable of diagnosing and fixing its own errors. This protocol guarantees 24/7 factory operation without human intervention.

## 🧬 Self-Healing Loop
Managed by the Watchdog agent, this process consists of 4 stages:

### 1. Loop Detection & Quarantine
Watchdog maintains a `crashHistory` for every agent.
- **Rule:** If an agent crashes more than 3 times within 5 minutes, the system places it in **Quarantine**.
- **Purpose:** To prevent faulty code from bloating the CPU and logs with an infinite loop (Crash Loop).

### 2. Self-Diagnosis
Watchdog scans the last 50 lines of the crashed agent's log to determine the error type:
- **Structural Errors:** `ReferenceError`, `TypeError`, `SyntaxError`.
- **Transient Errors:** Network timeout, File lock.

### 3. Auto-Patching
When a structural error is detected, Watchdog communicates with the Architect agent (`SYSTEM_INTEGRITY_VIOLATION`).
- Architect analyzes the faulty agent's source code and error log.
- It generates a fix and physically updates the agent's `.js` file (Self-Patch).

### 4. Restart
After the patch is applied, Watchdog resets the quarantine and restarts the agent with a clean slate.

## 🧠 Context Overflow Protection
To prevent LLM models (vLLM/NIM) from stalling due to token limits:
- Watchdog monitors `llm_communication.log` in real-time.
- If it detects `finish=length` or `tokens=4097` (Nemotron limit) errors, it resets the affected agent to clear its memory.

## 📜 Immortal Logging (Data Preservation)
No system data is EVER deleted:
- **Timestamped Rotation:** Logs are archived with ISO timestamps instead of being overwritten when they exceed 100MB.
- **Permanent Archive:** The `queue/done` and `queue/error` directories are kept forever as the system's "historical memory."
