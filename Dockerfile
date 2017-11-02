FROM node:alpine


WORKDIR /build

ADD . /build

# from .gitlab-ci.yml, to test build commands locally.
RUN apk add --no-cache git \
    && npm install -g yarn lerna \
    && yarn run bootstrap \
    # lerna and yarn mess up node_modules/.bin.
    # Delete this file, run yarn to restore .bin, then test.
    && rm "node_modules/.yarn-integrity" \
    && yarn \
    && yarn run test
