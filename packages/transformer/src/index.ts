/**
 *
 */
import { Params, TransformFn } from './Transform/Types';

import { composeCacheKey, composeTransform, ConstTrue } from './Transform/Compose';

import * as Babel from './Transform/Babel';
import * as TypeScript from './Transform/TypeScript';

export * from './Transform/Types';
export { Babel };
export { TypeScript };
export { composeCacheKey, composeTransform, ConstTrue };

function typeScriptFilter({filename}: Params<{}>): boolean {
  return filename.endsWith('.ts') || filename.endsWith('.tsx');
}

export let transform = composeTransform(TypeScript.transform, Babel.transform, typeScriptFilter, ConstTrue);
export let getCacheKey = composeCacheKey(TypeScript.getCacheKey, Babel.getCacheKey);
