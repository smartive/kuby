FROM alpine:3.7

ARG BUILD_DEPS="gettext"
ARG RUNTIME_DEPS="libintl"

WORKDIR /root

COPY ./scripts /usr/local/bin/

RUN set -x && \
    apk add --update $RUNTIME_DEPS && \
    apk add --virtual build_deps $BUILD_DEPS &&  \
    apk add --no-cache bash curl ca-certificates && \
    curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl && \
    cp /usr/bin/envsubst /usr/local/bin/envsubst && \
    apk del build_deps

CMD ["/bin/bash"]
