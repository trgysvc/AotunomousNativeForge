#!/bin/bash
# ANF Telemetry Watchdog - Never stops.
while true; do
  if ! pgrep -f "node agents/telemetry.js" > /dev/null; then
    echo "$(date) - Telemetry durmuş! Yeniden başlatılıyor..." >> logs/telemetry_watchdog.log
    nohup node agents/telemetry.js >> logs/telemetry.log 2>&1 &
  fi
  sleep 15
done
