# ANF INTERNAL SYSTEM DOCUMENTATION: USER GUIDE

## 🚀 Starting the System
ANF can be started via `systemd --user` services on Linux or directly using Node.js.

### Quick Start
```bash
npm run forge
```
This command triggers `bootstrap.js`, which:
1. Sets up the required directory hierarchy.
2. Validates `vault.json` settings.
3. Starts all agents (`architect`, `coder`, `tester`, `docs`, `telemetry`, `watchdog`) in the background.

## 📝 Starting a New Project (PRD Dropping)
To assign a new job to the system:
1. Create a folder for your project under `docs/reference/` (e.g., `docs/reference/new_project/`).
2. Drop your `prd.md` file into that folder.
3. Architect will discover this file within seconds, create the `src/new_project/` directory, and begin planning.

## 💎 PRD Writing Best Practices
To ensure Architect generates a flawless manifest:
- **Sprint Format:** Code your tasks using headers like `S1-1`, `S1-2`.
- **File Paths:** Always specify the target file path under each task, e.g., `**File:** path/to/file.ts`.
- **Dependencies:** If a task depends on another, note it as `**Dependencies:** S1-1`.

## 🛠️ Using the Dashboard
To monitor production live:
```bash
npm run dashboard
```
From `http://localhost:3000`:
- Track which agent is on which task.
- Monitor total LoC (Lines of Code) production.
- View real-time GPU efficiency and throughput.

## 🛑 Emergency Stop
If you need to stop the system entirely:
```bash
pkill -f "node agents/"
```
Even if stopped, the system remembers exactly where it left off from the files in `queue/processing` and continues **without any data loss** upon restart.
