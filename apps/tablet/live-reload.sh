#!/bin/bash
rm -f vite.log
vite --host &> vite.log &
VITE_PID=$!

echo "Starting Vite..."
sleep 3

LAN_URL=$(grep -Eo 'http://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+' vite.log | head -n 1)

if [ -z "$LAN_URL" ]; then
  echo "Failed to detect Vite server LAN URL. Exiting."
  exit 1
fi

echo "Vite is running at $LAN_URL"

CAPACITOR_CONFIG_FILE="./capacitor.live-reload-config.ts"

cat > "$CAPACITOR_CONFIG_FILE" <<EOL
import { CapacitorConfig } from "@capacitor/cli";

export const server: CapacitorConfig['server'] = {
  url: "$LAN_URL",
  cleartext: true
}
EOL

echo "Updated $CAPACITOR_CONFIG_FILE with the Vite server URL."

echo "Running npx cap sync..."
npx cap sync

echo "Vite process is running. Press Ctrl+C to stop."
tail -f vite.log
