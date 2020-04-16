FROM node:12-alpine as build

WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./

RUN npm ci

COPY ./config ./config
COPY ./src ./src

RUN npm run build
RUN npx pkg -t node12-alpine-x64 -o out/kuby .

FROM alpine:3.7 as kuby-releases

WORKDIR /root

ARG BUILD_DEPS="gettext"
ARG RUNTIME_DEPS="libintl libstdc++"

COPY --from=build /app/out/kuby /usr/local/bin/

RUN set -x && \
  apk add --update $RUNTIME_DEPS && \
  apk add --virtual build_deps $BUILD_DEPS && \
  apk add --no-cache curl ca-certificates git

RUN kuby kubectl refresh

FROM kuby-releases

ARG KUBECTL_VERSION="1"

RUN kuby kubectl install -n ${KUBECTL_VERSION}
