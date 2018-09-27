FROM node:10-alpine as build

WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./

RUN npm ci

COPY ./config ./config
COPY ./src ./src

RUN npm run build
RUN npx pkg -t node10-alpine-x64 -o out/k8s .

FROM alpine:3.7 as k8s-releases

WORKDIR /root

ARG BUILD_DEPS="gettext"
ARG RUNTIME_DEPS="libintl libstdc++"

COPY --from=build /app/out/k8s /usr/local/bin/

RUN set -x && \
  apk add --update $RUNTIME_DEPS && \
  apk add --virtual build_deps $BUILD_DEPS && \
  apk add --no-cache curl ca-certificates

RUN k8s kubectl refresh

FROM k8s-releases

ARG KUBECTL_VERSION="1"

RUN k8s kubectl install -n ${KUBECTL_VERSION}
