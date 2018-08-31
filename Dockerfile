FROM node:10-alpine as build

WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./

RUN npm ci

COPY ./config ./config
COPY ./src ./src

RUN npm run build
RUN npx pkg -t node10-alpine-x64 -o out/k8s .

FROM alpine:3.7

ARG BUILD_DEPS="gettext"
ARG RUNTIME_DEPS="libintl libstdc++"

WORKDIR /root

COPY --from=build /app/out/k8s /usr/local/bin/

RUN set -x && \
  apk add --update $RUNTIME_DEPS && \
  apk add --virtual build_deps $BUILD_DEPS && \
  apk add --no-cache curl ca-certificates && \
  curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
  chmod +x ./kubectl && \
  mv ./kubectl /usr/local/bin/kubectl && \
  apk del build_deps
