#!/bin/bash
# Instala o watcher de autocorreção (qa-device-watch) como serviço systemd.
# Uso: PW=<sudo_pass> bash setup-autoheal.sh
set -e
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "--- cacheando sudo ---"
echo "$PW" | sudo -S -v

echo "--- instalando watcher ---"
sudo install -m 0755 "$SELF_DIR/device-watch.sh" /usr/local/bin/qa-device-watch.sh

sudo tee /etc/systemd/system/qa-device-watch.service >/dev/null <<'UNIT'
[Unit]
Description=QA Track device farm autoheal (iOS tunnel/socket + Android adb)
After=docker.service pmd3-tunneld.service usbmuxd.service
Wants=docker.service

[Service]
ExecStart=/usr/local/bin/qa-device-watch.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

echo "--- ativando serviço ---"
sudo systemctl daemon-reload
sudo systemctl enable --now qa-device-watch
sleep 2
echo "--- status ---"
sudo systemctl is-active qa-device-watch
echo "--- últimos logs ---"
sudo journalctl -u qa-device-watch --no-pager -n 5 2>/dev/null || true
