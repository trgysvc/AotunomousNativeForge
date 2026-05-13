# ANF INTERNAL SYSTEM DOCUMENTATION: ARCHITECTURE

## 🏗️ Overview
Autonomous Native Forge (ANF) is a "Sovereign" software factory that runs entirely locally and utilizes the file system for Inter-Process Communication (IPC). It requires no external dependencies (npm, cloud, etc.) for its core operations.

## 📁 File-Based Communication (IPC)
Agents communicate asynchronously via the `queue/` directory:
- **`inbox/`**: Waiting area for new incoming tasks (JSON).
- **`processing/`**: Area where currently active tasks are "locked".
- **`done/` & `error/`**: Permanent archival areas for completed or failed tasks.

### 🛡️ Atomic Messaging Protocol (Atomic Writes)
To prevent Race Conditions, **Atomic Writing** is implemented in `base-agent.js`:
1. The message is first written with a `.tmp` extension.
2. Once the write is complete, it is renamed to `.json` using `fs.renameSync`.
This ensures an agent cannot read a partially written message.

## 🔐 Locking Mechanism (`withLock`)
To prevent conflicts on shared files like the manifest, `withLock` is used.
- **Method:** Atomic directory creation (`fs.mkdirSync`).
- **Stale Lock Protection:** If a lock persists for more than 30 seconds, it is considered "stale" and is automatically broken to prevent production stalls.

## 🚦 Agent Hierarchy
1. **Architect:** Orchestrator and logic repairman. Synthesizes PRDs and dispatches tasks.
2. **Coder:** Implementer. Capable of parallel execution (`vault.concurrency.CODER`).
3. **Tester:** Quality gatekeeper. Responsible for the 5-layer QA process.
4. **Watchdog:** Sentinel. Monitors system health and stalls.
5. **Telemetry:** Reporter. Monitors system metrics 24/7.
