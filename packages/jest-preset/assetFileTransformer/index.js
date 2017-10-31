'use strict';
const path = require('path');

const parts = [__filename];

function process(_, filename) {
  return  `module.exports = {
  testUri: ${JSON.stringify(path.relative(__dirname, filename))}
};`;
}
exports.process = process;

function getCacheKey() {
  const key = crypto.createHash('md5');
  cacheKeyParts.forEach((part) => key.update(part));
  return key.digest('hex');
}
exports.getCacheKey = getCacheKey;