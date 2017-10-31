import * as crypto from 'crypto';
import * as fs from 'fs';

import {
  RawSourceMap,
  SourceMapConsumer,
  SourceMapGenerator,
  SourceNode,
} from 'source-map';

import { CacheKeyFn, Params, Transformer, TransformFn } from './Types';

export const ConstTrue = (_: any) => true;

type CompactSourceMap = [number, number, number, number, string];

function composeRawSourceMap(firstMap: RawSourceMap, secondMap: any) {
  const firstConsumer = new SourceMapConsumer(firstMap);
  const composedMap: any[] = [];
  secondMap.forEach(
    (
      [
        generatedLine,
        generatedColumn,
        originalLine,
        originalColumn,
        name,
      ]: CompactSourceMap,
    ) => {
      if (originalLine) {
        const firstOriginal = firstConsumer.originalPositionFor({
          column: originalColumn,
          line: originalLine,
        });
        if (firstOriginal.line) {
          if (typeof name === 'string') {
            composedMap.push([
              generatedLine,
              generatedColumn,
              firstOriginal.line,
              firstOriginal.column,
              name,
            ]);
          } else {
            composedMap.push([
              generatedLine,
              generatedColumn,
              firstOriginal.line,
              firstOriginal.column,
            ]);
          }
        }
      }
    },
  );
  return composedMap;
}

function composeSourceMaps(
  firstMap: RawSourceMap,
  secondMap: RawSourceMap,
  filename: string,
  src: string,
  transformedSrc: string,
): any {
  const firstConsumer = new SourceMapConsumer(firstMap);
  const secondConsumer = new SourceMapConsumer(secondMap);
  const map = new SourceMapGenerator();
  map.setSourceContent(filename, src);
  secondConsumer.eachMapping(
    ({
      source,
      generatedLine,
      generatedColumn,
      originalLine,
      originalColumn,
      name,
    }) => {
      if (originalLine) {
        const original = firstConsumer.originalPositionFor({
          column: originalColumn,
          line: originalLine,
        });
        if (original.line) {
          map.addMapping({
            generated: { line: generatedLine, column: generatedColumn },
            name,
            original: { line: original.line, column: original.column },
            source: filename,
          });
        }
      }
    },
  );
  // @ts-ignore
  return map.toJSON();
}

function composeMaps(
  firstResult: RawSourceMap,
  secondResult: RawSourceMap | CompactSourceMap[],
  filename: string,
  src: string,
  transformedSrc: string,
) {
  if (Array.isArray(secondResult)) {
    return composeRawSourceMap(firstResult, secondResult);
  } else {
    return composeSourceMaps(
      firstResult,
      secondResult,
      filename,
      src,
      transformedSrc,
    );
  }
}

export function composeTransform<FirstExtra, SecondExtra>(
  first: TransformFn,
  second: TransformFn,
  firstFilter: ((params: Params<FirstExtra>) => boolean) = ConstTrue,
  secondFilter: ((params: Params<SecondExtra>) => boolean) = ConstTrue,
): TransformFn<FirstExtra & SecondExtra>  {
  return ({ options, filename, src }) => {
    const maps: RawSourceMap[] = [];
    let map: any;
    let transformedSrc: string = src;

    if (firstFilter({ filename, options, src: transformedSrc })) {
      const firstResult = first({ filename, options, src: transformedSrc });

      transformedSrc = firstResult.code;

      maps.push(firstResult.map);
    }

    if (secondFilter({ filename, options, src: transformedSrc })) {
      const secondResult = second({ filename, options, src: transformedSrc });

      transformedSrc = secondResult.code;

      maps.push(secondResult.map);
    }

    if (maps.length === 1) {
      map = maps[0];
    } else if (maps.length === 2) {
      map = composeMaps(maps[0], maps[1], filename, src, transformedSrc);
    }

    return {
      code: transformedSrc,
      filename,
      map,
    };
  };
}

const THIS_FILE = fs.readFileSync(__filename);

export function composeCacheKey(
  firstGetCacheKey: CacheKeyFn,
  secondGetCacheKey: CacheKeyFn,
  extraParams: Array<string | Buffer> = [],
): CacheKeyFn {
  return (fileData, filename, configString) => {
    const cacheKeyParts = [
      THIS_FILE,
      fileData || '',
      filename || '',
      firstGetCacheKey(fileData, filename, configString),
      secondGetCacheKey(fileData, filename, configString),
      ...extraParams,
    ];

    const key = crypto.createHash('md5');
    cacheKeyParts.forEach((part) => key.update(part));
    return key.digest('hex');
  };
}
