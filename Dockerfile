FROM alpine:3.7

WORKDIR /root

COPY ./config/kube-config.yml /root/.kube/config
COPY ./scripts /usr/local/bin/

ENV BUILD_DEPS="gettext"  \
    RUNTIME_DEPS="libintl"

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
