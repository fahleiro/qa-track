# ============================================================
#  qa-track node-agent — Dockerfile (uso em Linux com USB privileged)
# ============================================================
#  Inclui android-tools-adb para descobrir devices.
#  ATENÇÃO: para acessar USB do host, o container PRECISA rodar
#  com --privileged e volume /dev/bus/usb. Em Windows/Mac, USB
#  não é passável — rode no host com `npm start`.
# ============================================================

FROM node:18-bullseye-slim

RUN apt-get update && apt-get install -y \
    android-tools-adb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src/ ./src/

CMD ["node", "src/server.js"]
