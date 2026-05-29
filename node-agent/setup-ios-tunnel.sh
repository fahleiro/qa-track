#!/bin/bash
# Instala o tunneld (pymobiledevice3 RemoteXPC) como serviço systemd e valida screenshot.
# Uso: PW=<sudo_pass> bash setup-ios-tunnel.sh
set -e
PMD=/home/dbserver/pmd3/bin/pymobiledevice3

echo "--- cacheando sudo ---"
echo "$PW" | sudo -S -v

echo "--- instalando unit pmd3-tunneld ---"
sudo tee /etc/systemd/system/pmd3-tunneld.service >/dev/null <<'UNIT'
[Unit]
Description=pymobiledevice3 RemoteXPC tunneld (iOS 17+ developer services)
After=network-online.target usbmuxd.service
Wants=usbmuxd.service

[Service]
ExecStart=/home/dbserver/pmd3/bin/pymobiledevice3 remote tunneld
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

echo "--- parando tunnel solto (bracket trick) e ativando service ---"
sudo pkill -f "[r]emote tunneld" 2>/dev/null || true
sudo systemctl daemon-reload
sudo systemctl enable --now pmd3-tunneld
sleep 12

echo "--- status ---"
sudo systemctl is-active pmd3-tunneld
echo "--- journal (tunnel criado?) ---"
sudo journalctl -u pmd3-tunneld --no-pager -n 25 | grep -iE "created tunnel|error|exception" | tail -6 || true

echo "--- screenshot DVT ---"
$PMD developer dvt screenshot /tmp/ios.png 2>&1 | tail -6
echo "--- arquivo ---"
ls -la /tmp/ios.png 2>&1 || true
file /tmp/ios.png 2>&1 || true
