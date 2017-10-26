FROM node:alpine


WORKDIR /build

ADD . /build

# from .gitlab-ci.yml, to test build commands locally.
RUN apk add --no-cache git \
    && npm install -g yarn lerna \
    && yarn run bootstrap --hoist \
    && yarn \
    && yarn run test
