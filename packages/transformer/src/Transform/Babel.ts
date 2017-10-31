/** Copyright (c) 2017-present, Aaron Friel.
 *
 * This is a fork of metro-bundler/src/transformer.js
 *
 */

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Note: This is a fork of the fb-specific transform.js
 *
 * @flow
 * @format
 */
import { TransformOptions } from 'babel-core';
import babel = require('babel-core');
import externalHelpersPlugin = require('babel-plugin-external-helpers');
import inlineRequiresPlugin = require('babel-preset-fbjs/plugins/inline-requires');
import makeHMRConfig = require('babel-preset-react-native/configs/hmr');
import resolvePlugins = require('babel-preset-react-native/lib/resolvePlugins');
import crypto = require('crypto');
import fs = require('fs');
import path = require('path');

import { Options, Params, Transformer, TransformResult } from './Types';


const cacheKeyParts = [
  fs.readFileSync(__filename),
  // tslint:disable-next-line:no-var-requires
  require('babel-plugin-external-helpers/package.json').version,
  // tslint:disable-next-line:no-var-requires
  require('babel-preset-fbjs/package.json').version,
  // tslint:disable-next-line:no-var-requires
  require('babel-preset-react-native/package.json').version,
];

// tslint:disable-next-line:no-any
type BabelPlugins = any[];

/**
 * Return a memoized function that checks for the existence of a
 * project level .babelrc file, and if it doesn't exist, reads the
 * default RN babelrc file and uses that.
 */
const getBabelRC = (() => {
  let babelRC: TransformOptions | null = null;

  return function _getBabelRC(projectRoot: string) {
    if (babelRC !== null) {
      return babelRC;
    }

    babelRC = {plugins: []};
    let projectBabelRCPath;

    if (projectRoot) {
      // Let's look in the platform target folder first.
      if (typeof process.env.PLATFORM_TARGET === 'string') {
        projectBabelRCPath = path.resolve(projectRoot, process.env.PLATFORM_TARGET, '.babelrc');
      }

      // Let's look for the .babelrc in the project root.
      // In the future let's look into adding a command line option to specify
      // this location.
      if (!projectBabelRCPath || !fs.existsSync(projectBabelRCPath)) {
        if (projectRoot) {
          projectBabelRCPath = path.resolve(projectRoot, '.babelrc');
        }
      }
    }

    // If a .babelrc file doesn't exist in the project,
    // use the Babel config provided with react-native.
    if (!projectBabelRCPath || !fs.existsSync(projectBabelRCPath)) {
      babelRC = {
        "presets": [ "react-native" ],
        "plugins": []
      }

      if (babelRC == null || babelRC.presets == null) {
        throw new Error('Error: unable to load rn-babelrc.json');
      }

      // Require the babel-preset's listed in the default babel config
      babelRC.presets = babelRC.presets.map((preset: string) =>
        // $FlowFixMe: dynamic require can't be avoided
        require('babel-preset-' + preset),
      );
      babelRC.plugins = resolvePlugins(babelRC.plugins);
    } else {
      // if we find a .babelrc file we tell babel to use it
      babelRC.extends = projectBabelRCPath;
    }

    return babelRC;
  };
})();

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(filename: string, options: Options): TransformOptions {
  const babelRC = getBabelRC(options.projectRoot);

  const extraConfig = {
    babelrc:
      typeof options.enableBabelRCLookup === 'boolean'
        ? options.enableBabelRCLookup
        : true,
    code: true,
    filename,
  };

  let config: TransformOptions = {...babelRC, ...extraConfig};

  // Add extra plugins
  const extraPlugins = [externalHelpersPlugin];

  const inlineRequires = options.inlineRequires;
  const blacklist =
    typeof inlineRequires === 'object' ? inlineRequires.blacklist : null;
  if (inlineRequires && !(blacklist && filename in blacklist)) {
    extraPlugins.push(inlineRequiresPlugin);
  }

  config.plugins = extraPlugins.concat(config.plugins);

  if (options.dev && options.hot) {
    const hmrConfig = makeHMRConfig(options, filename);
    config = {...config, ...hmrConfig};
  }

  return {...babelRC, ...config};
}

export interface ExtraOptions {
  retainLines?: boolean;
  babelConfig?: TransformOptions;
}

export function transform({filename, options, src}: Params<ExtraOptions>): TransformResult {
  options = options || {platform: '', projectRoot: '', inlineRequires: false};

  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : 'production';

  try {
    const babelConfig: TransformOptions = {
      ...buildBabelConfig(filename, options),
      ...options.babelConfig,
      sourceMaps: true,
    };
    const { ast, code, map } = babel.transform(src, babelConfig);

    // @ts-ignore code must be set.
    return { ast, code, map, filename };
  } finally {
    process.env.BABEL_ENV = OLD_BABEL_ENV;
  }
}

export function getCacheKey() {
  const key = crypto.createHash('md5');
  cacheKeyParts.forEach((part) => key.update(part));
  return key.digest('hex');
}
