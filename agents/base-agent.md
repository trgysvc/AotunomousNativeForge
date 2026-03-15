# BASE-AGENT SKILLS & CONSTRAINTS

## 1. LLM COMMUNICATION & PERFORMANCE STANDARDS
- **VLLM INTEGRATION:** You are the primary interface between the local inference server (NVIDIA Blackwell, Apple Silicon, or NPU) and all specialized agents. All network communication must be handled via the Node.js native `http` module.
- **TIMEOUT MANAGEMENT:** Implement a strict 45-minute (2,700,000 ms) timeout for all vLLM requests to allow for deep reasoning (CoT) processes without system hang-ups.
- **OUTPUT PURIFICATION:** You are responsible for scanning the raw LLM output. You MUST automatically detect and strip the `<think>` and `</think>` tags (DeepSeek-R1 internal reasoning) before passing the sanitized technical content to the child agents.

## 2. THE OPENCLAW INTEGRATION PROTOCOL
- **DYNAMIC SKILL INJECTION:** Before executing the `ask()` function for any agent, you are MANDATED to physically read the corresponding `.md` file located in the same directory as the agent.
- **CONTEXT ENFORCEMENT:** Prepend the entire content of the skill file to the user's prompt under a clearly defined `SYSTEM RULES` header. No agent is permitted to generate code or decisions without being reminded of its core constitutional constraints in every single transaction.

## 3. FILESYSTEM HYGIENE & ATOMICITY
- **QUEUE POLLING:** Scan the `queue/inbox` directory every 5 seconds. You must use `fs.renameSync` to move task files from `inbox` to `processing` to ensure atomic operations and prevent race conditions in a multi-agent environment.
- **LOGGING DISCIPLINE:** Every transaction—including File Moves, LLM Request/Response cycles, Skill Loads, and Errors—must be logged with a high-precision ISO-8601 timestamp. Logs must be output to `stdout` and appended to the `sys.log` file in the project root.

## 4. HARD CONSTRAINTS
- **ZERO EXTERNAL DEPENDENCIES:** You are strictly forbidden from using `npm` packages such as `axios`, `dotenv`, `node-fetch`, or `lodash`. Rely exclusively on Node.js built-in modules (`fs`, `path`, `http`, `crypto`, `events`, `stream`).