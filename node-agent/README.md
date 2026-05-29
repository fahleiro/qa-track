# QA Track — node-agent

Agente leve que roda na máquina com devices Android plugados via USB. Faz:

1. **Scan ADB local** — `adb devices -l` + `getprop` por device.
2. **Auto-registro no dashboard** — POST `${DASHBOARD_URL}/api/nodes/register` no boot.
3. **Heartbeat 30s** — POST `${DASHBOARD_URL}/api/nodes/heartbeat` com snapshot de devices.
4. **Expõe REST local** (porta 4724) para o dashboard fazer fan-out:
   - `GET  /agent/health`
   - `GET  /agent/devices`
   - `GET  /agent/devices/:udid/screenshot`
   - `GET  /agent/devices/:udid/info`

## Instalação (Windows/Mac — fora do Docker)

> Docker Desktop **não** passa USB para containers. Em Windows e Mac, rode o agent diretamente no host.

```bash
# 1) Pré-requisitos: Node 18 + ADB no PATH (Android platform-tools).
adb devices                       # confirme que seu device aparece

# 2) Instalar deps
cd node-agent
npm install

# 3) Configurar .env (copie do exemplo)
cp .env.example .env
# Edite:
#   DASHBOARD_URL=http://localhost:3000
#   AGENT_NAME=meu-pc                              (único por máquina)
#   AGENT_PUBLIC_URL=http://host.docker.internal:4724
#   AGENT_PORT=4724

# 4) Rodar
npm start
```

Log esperado:
```
[agent] HTTP em :4724
[agent] Registered with dashboard. 1 device(s) reported.
[agent] heartbeat OK (1 devices)
```

## Linux com Docker (USB privileged)

```bash
docker build -t qa-track-node-agent .
docker run --rm --privileged \
  -v /dev/bus/usb:/dev/bus/usb \
  -e DASHBOARD_URL=http://host:3000 \
  -e AGENT_NAME=lab-linux-01 \
  -e AGENT_PUBLIC_URL=http://host-ip:4724 \
  -p 4724:4724 \
  qa-track-node-agent
```

## Como o dashboard sabe deste agent?

No boot, o agent POSTa `register` com `{name, public_url, version, devices: [...]}`.
A cada 30s, POSTa `heartbeat` com o snapshot atual. O dashboard considera o agent
*online* se `last_heartbeat < 60s`.

Quando o usuário lista devices no dashboard, ele faz fan-out chamando
`GET ${public_url}/agent/devices` em todos os agents online.

## iOS no Linux (v0.3.0)

Suporte a devices iOS (descoberta, metadados e screenshot) sem Mac, via
`libimobiledevice` + `pymobiledevice3`. **Requer host Linux** (USB não passa
para container no Windows/Mac).

```bash
# 1) Ferramentas + daemon USB
sudo apt-get install -y libimobiledevice-utils usbmuxd
sudo systemctl enable --now usbmuxd

# 2) Conectar o iPhone e tocar "Confiar"; ligar Modo de Desenvolvedor
#    (se o toggle não aparecer): pymobiledevice3 amfi reveal-developer-mode

# 3) Tunnel RemoteXPC (iOS 17+) como serviço systemd
bash setup-ios-tunnel.sh

# 4) Montar o Developer Disk Image (uma vez)
~/pmd3/bin/pymobiledevice3 mounter auto-mount   # ou pymobiledevice3 do PATH

# 5) Subir o agent dockerizado (Android + iOS)
docker build -t qa-track-node-agent:0.3.0 .
bash run-docker.sh
```

`run-docker.sh` sobe o container `--privileged --network host` montando
`/dev/bus/usb`, `/var/run/usbmuxd`, `/var/lib/lockdown` e `~/.android`.
O screenshot iOS depende de **Developer Mode ON + DDI montado + `pmd3-tunneld` ativo**.

### Autocorreção plug-and-play (`qa-device-watch`)

Ao desconectar/reconectar o iPhone (ou quando o `usbmuxd` reinicia), o socket e o
tunnel RemoteXPC ficam *stale*. O serviço systemd **`qa-device-watch`** (instalado
por `setup-autoheal.sh`) cura isso sozinho, em segundos:

```bash
PW=<sudo_pass> bash setup-autoheal.sh
```

| Falha | Detecção | Cura automática |
|---|---|---|
| socket usbmuxd stale → iOS some do agent | host vê iOS mas `/agent/devices` não | `docker restart qa-node-agent` |
| tunnel RemoteXPC stale → screenshot 500 | tunneld (`:49151`) não conhece o udid | `mounter auto-mount` + `restart pmd3-tunneld` |
| Android offline/unauthorized | `adb devices` no container | `adb reconnect` |

Logs: `journalctl -u qa-device-watch -f`. Android não sofre do problema de socket
(usa `/dev/bus/usb` direto); só o `adb reconnect` em offline/unauthorized.
