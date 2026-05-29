#!/bin/bash
# Sobe o node-agent dockerizado no host Linux.
#   Android : adb via USB (/dev/bus/usb + chave adb do host)
#   iOS     : libimobiledevice (socket usbmuxd) + pymobiledevice3 (screenshot via DVT)
# Pré-req iOS: serviço systemd `pmd3-tunneld` ativo (ver setup-ios-tunnel.sh).
set -e
cd "$HOME/Documents/node-agent-qa-track-0.2.1"

echo "--- parando agent npm do host (bracket trick evita auto-match) ---"
pkill -f "[n]ode src/server.js" 2>/dev/null || true
sleep 1

echo "--- liberando USB (adb kill-server) ---"
adb kill-server 2>/dev/null || true

echo "--- tunneld iOS ativo? ---"
systemctl is-active pmd3-tunneld 2>/dev/null || echo "AVISO: pmd3-tunneld inativo — screenshot iOS vai falhar"

echo "--- recriando container (host network p/ alcançar o tunneld) ---"
docker rm -f qa-node-agent >/dev/null 2>&1 || true
docker run -d --name qa-node-agent --privileged \
  --network host \
  -v /dev/bus/usb:/dev/bus/usb \
  -v /var/run/usbmuxd:/var/run/usbmuxd \
  -v /var/lib/lockdown:/var/lib/lockdown \
  -v "$HOME/.android:/root/.android" \
  --restart unless-stopped \
  --env-file ./.env \
  qa-track-node-agent:0.3.0

sleep 10
echo "--- docker ps ---"
docker ps --filter name=qa-node-agent --format '{{.Names}} | {{.Status}}'
echo "--- logs ---"
docker logs qa-node-agent 2>&1 | tail -12
echo "--- /agent/devices ---"
curl -s -m 6 http://localhost:4724/agent/devices; echo
echo "--- screenshot iOS via agent (HTTP) ---"
curl -s -m 30 -o /tmp/agent-ios.png -w 'http=%{http_code} bytes=%{size_download}\n' \
  http://localhost:4724/agent/devices/00008030-000259520205402E/screenshot
file /tmp/agent-ios.png 2>&1 || true
