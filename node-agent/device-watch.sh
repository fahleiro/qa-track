#!/bin/bash
# ============================================================
#  qa-device-watch — autocorreção plug-and-play do device farm
# ============================================================
#  Roda no HOST (systemd). A cada POLL segundos detecta e cura,
#  sem intervenção manual, os modos de falha conhecidos:
#
#   (A) socket usbmuxd stale (iPhone replugado) → agent perde o iOS
#         → docker restart <container>  (re-vincula o bind-mount do socket)
#   (B) tunnel RemoteXPC stale → screenshot iOS dá 500
#         → mounter auto-mount + restart pmd3-tunneld (recria o tunnel)
#   (C) Android offline/unauthorized
#         → adb reconnect (dentro do container)
#
#  Sinais de saúde:
#   - host vê iOS:        idevice_id -l
#   - tunnel saudável:    GET tunneld:/  contém o udid
#   - agent vê iOS:       GET agent/agent/devices contém "platform":"ios"
#   - android ruim:       adb devices => offline|unauthorized
# ============================================================
set -u

PMD=${PMD_BIN:-/home/dbserver/pmd3/bin/pymobiledevice3}
AGENT=${AGENT_URL:-http://localhost:4724}
TUNNELD=${TUNNELD_URL:-http://127.0.0.1:49151}
CONTAINER=${AGENT_CONTAINER:-qa-node-agent}
POLL=${POLL_SECONDS:-5}

log(){ echo "[$(date '+%F %T')] $*"; }

log "qa-device-watch iniciado (poll ${POLL}s, agent=${AGENT}, container=${CONTAINER})"

while true; do
  # ---------------- iOS ----------------
  udid=$(idevice_id -l 2>/dev/null | head -n1)
  if [ -n "${udid}" ]; then

    # (B) tunnel RemoteXPC saudável? (tunneld deve conhecer o udid)
    if ! curl -s -m 4 "${TUNNELD}" 2>/dev/null | grep -q "${udid}"; then
      log "iOS ${udid}: sem tunnel RemoteXPC -> auto-mount + restart pmd3-tunneld"
      "${PMD}" mounter auto-mount >/dev/null 2>&1 || true
      systemctl restart pmd3-tunneld
      sleep 14
      continue
    fi

    # (A) agent enxerga o iOS? (se host tem mas agent nao, socket esta stale)
    if ! curl -s -m 5 "${AGENT}/agent/devices" 2>/dev/null | grep -q '"platform":"ios"'; then
      log "iOS ${udid} presente no host mas ausente no agent -> docker restart ${CONTAINER}"
      docker restart "${CONTAINER}" >/dev/null 2>&1 || true
      sleep 12
      continue
    fi
  fi

  # ---------------- Android ----------------
  if docker exec "${CONTAINER}" adb devices 2>/dev/null | grep -qE 'offline|unauthorized'; then
    log "Android offline/unauthorized -> adb reconnect"
    docker exec "${CONTAINER}" adb reconnect offline >/dev/null 2>&1 || true
    docker exec "${CONTAINER}" adb reconnect          >/dev/null 2>&1 || true
    sleep 3
  fi

  sleep "${POLL}"
done
