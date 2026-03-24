FROM node:20-bookworm-slim

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libu2f-udev \
    libvulkan1 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

COPY package.json package-lock.json tsconfig.json wdio.conf.ts eslint.config.mjs allurerc.mjs ./
COPY components ./components
COPY config ./config
COPY data ./data
COPY demo-apps ./demo-apps
COPY lint ./lint
COPY pages ./pages
COPY reporters ./reporters
COPY scripts ./scripts
COPY tests ./tests
COPY utils ./utils
COPY .env.example ./.env.example

RUN npm ci

CMD ["bash", "./scripts/run-tests.sh"]
