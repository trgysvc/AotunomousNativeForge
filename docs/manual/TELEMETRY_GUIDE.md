# ANF INTERNAL SYSTEM DOCUMENTATION: TELEMETRY GUIDE

## 📊 What is the Telemetry System?
The Telemetry agent (`telemetry.js`) is a "black box" recording device that monitors system performance, cost, and health 24/7. It updates the `anf_system_report.md` file every 15 seconds.

## 📉 Key Metrics (KPIs)

### 1. Net Coding Speed (LoC/min)
The number of "valid" (passed tests) lines of code produced per minute. This metric reflects both Coder's speed and Tester's verification throughput.

### 2. MTBF (Mean Time Between Failures)
The average time between errors. It measures system stability. The Sovereign Protocol aims to continually increase this duration.

### 3. GPU KV Cache & Efficiency
Monitors GPU memory usage via vLLM data. Usage above 90% indicates a "Context Overflow" risk and is monitored by the Watchdog.

## 📝 System Report (`anf_system_report.md`)
This file consists of 4 main sections:
- **Project Progress:** Percentage completion for each sprint.
- **Agent Health:** CPU/RAM usage and last-seen (heartbeat) timestamp for each agent.
- **Resource Usage:** GPU utilization and vLLM throughput values.
- **Proof-of-Work:** Summary of the last 10 completed tasks.

## 🕵️‍♂️ Audit Trail
ANF accounts for every token it generates:
- **`llm_communication.log`**: Every request and response from the model is stored here as raw data.
- **`DEVLOG.md`**: A human-readable summary of historical progress and decisions.

## 💡 Tip
You can use telemetry data to optimize vLLM parameters (such as `max_model_len`) based on your specific hardware capabilities.
