import * as fs from 'fs';

import {
  Babel,
  composeCacheKey,
  composeTransform,
  ConstTrue,
  Params,
  TransformFn,
  TypeScript,
} from '@alot/transformer';

import { TransformOptions } from 'babel-core';

import * as babelIstanbulPlugin from 'babel-plugin-istanbul';

function typeScriptFilter({filename}: Params): boolean {
  return filename.endsWith('.ts') || filename.endsWith('.tsx');
}

const transformer: TransformFn<Babel.ExtraOptions> =
  composeTransform(TypeScript.transform, Babel.transform, typeScriptFilter, ConstTrue);

export function process(
  src: string,
  filename: string,
  config: any,
  transformOptions: any,
): string {
  const babelRC: TransformOptions = {
    plugins: [],
    presets: ['jest'],
  };

  if (transformOptions && transformOptions.instrument) {
    babelRC.plugins = (babelRC.plugins || []).concat([
      [
        babelIstanbulPlugin,
        {
          // files outside `cwd` will not be instrumented
          cwd: config.rootDir,
          exclude: [],
        },
      ],
    ]);
  }

  const transformResult = transformer({
    filename,
    localPath: filename,
    options: {
      babelConfig: babelRC,
      dev: true,
      inlineRequires: true,
      platform: '',
      projectRoot: config.rootDir,
      retainLines: true,
    },
    src,
  });

  return transformResult.code;
}

const THIS_FILE = fs.readFileSync(__filename);

export const getCacheKey = composeCacheKey(
  TypeScript.getCacheKey,
  Babel.getCacheKey,
  [
    THIS_FILE,
  ],
);
