# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
ARG VITE_API_URL=""
ARG VITE_PUSHER_APP_KEY=""
ARG VITE_PUSHER_APP_CLUSTER="ap1"
ARG VITE_PUSHER_SCHEME="https"
ENV VITE_API_URL=$VITE_API_URL \
    VITE_PUSHER_APP_KEY=$VITE_PUSHER_APP_KEY \
    VITE_PUSHER_APP_CLUSTER=$VITE_PUSHER_APP_CLUSTER \
    VITE_PUSHER_SCHEME=$VITE_PUSHER_SCHEME

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY infrastructure/docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || wget -qO- http://127.0.0.1/ >/dev/null || exit 1
