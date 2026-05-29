# ============================================================
#  qa-track node-agent — Dockerfile (Linux com USB)
# ============================================================
#  Android: android-tools-adb (adb).
#  iOS    : libimobiledevice-utils (listagem/metadados) +
#           pymobiledevice3 (screenshot iOS 17+ via DVT).
#
#  iOS 17/18 exige Developer Mode ON, Developer Disk Image montado
#  e o tunnel RemoteXPC ativo. O tunnel roda NO HOST como serviço
#  systemd `pmd3-tunneld` (pymobiledevice3 remote tunneld); por isso
#  o container sobe com --network host, para alcançar o tunneld
#  (127.0.0.1:49151) e a interface do tunnel.
#
#  Run (Linux apenas — Win/Mac não passam USB):
#    docker run -d --name qa-node-agent --privileged --network host \
#      -v /dev/bus/usb:/dev/bus/usb \
#      -v /var/run/usbmuxd:/var/run/usbmuxd \
#      -v /var/lib/lockdown:/var/lib/lockdown \
#      -v "$HOME/.android:/root/.android" \
#      --env-file ./.env \
#      qa-track-node-agent:0.4.1
# ============================================================

FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y \
    android-tools-adb \
    libimobiledevice-utils \
    python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# pymobiledevice3: screenshot iOS 17+. --break-system-packages: imagem é descartável.
RUN pip3 install --no-cache-dir --break-system-packages pymobiledevice3

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src/ ./src/

EXPOSE 4724

CMD ["node", "src/server.js"]
