import * as crypto from "crypto";
import * as fs from "fs";

import { SourceMapConsumer, SourceMapGenerator } from "source-map";

import { CacheKeyFn, Params, Transformer, TransformFn } from "./Types";

import * as babel from "./Babel";
import * as typescript from "./TypeScript";

function composeRawSourceMap(tsMap, babelMap) {
  const tsConsumer = new SourceMapConsumer(tsMap);
  const composedMap = [];
  babelMap.forEach(
    ([generatedLine, generatedColumn, originalLine, originalColumn, name]) => {
      if (originalLine) {
        const tsOriginal = tsConsumer.originalPositionFor({
          column: originalColumn,
          line: originalLine,
        });
        if (tsOriginal.line) {
          if (typeof name === 'string') {
            composedMap.push([
              generatedLine,
              generatedColumn,
              tsOriginal.line,
              tsOriginal.column,
              name
            ]);
          } else {
            composedMap.push([
              generatedLine,
              generatedColumn,
              tsOriginal.line,
              tsOriginal.column
            ]);
          }
        }
      }
    },
  );
  return composedMap;
}

function composeSourceMaps(tsMap, babelMap, tsFileName, tsContent, babelCode) {
  const tsConsumer = new SourceMapConsumer(tsMap);
  const babelConsumer = new SourceMapConsumer(babelMap);
  const map = new SourceMapGenerator();
  map.setSourceContent(tsFileName, tsContent);
  babelConsumer.eachMapping(
    ({
      source,
      generatedLine,
      generatedColumn,
      originalLine,
      originalColumn,
      name
    }) => {
      if (originalLine) {
        const original = tsConsumer.originalPositionFor({
          column: originalColumn,
          line: originalLine
        });
        if (original.line) {
          map.addMapping({
            generated: { line: generatedLine, column: generatedColumn },
            name,
            original: { line: original.line, column: original.column },
            source: tsFileName
          });
        }
      }
    },
  );
  // @ts-ignore
  return map.toJSON();
}

function composeMaps(
  filename: string,
  src: string,
  firstMap: any,
  secondMap: any,
  secondCode?: string,
) {
  if (Array.isArray(secondMap)) {
    return composeRawSourceMap(firstMap, secondMap);
  } else {
    return composeSourceMaps(firstMap, secondMap, filename, src, secondCode);
  }
}

export let transform: TransformFn = ({ filename, options, src }) => {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    const tsResult = typescript.transform({ filename, options, src });

    const babelResult = babel.transform({
      filename,
      options,
      src: tsResult.code,
    });

    const composedMap = Array.isArray(babelResult.map)
      ? composeRawSourceMap(tsResult.map, babelResult.map)
      : composeSourceMaps(
          tsResult.map,
          babelResult.map,
          filename,
          src,
          babelResult.code,
        );

    return {
      ...babelResult,
      map: composedMap,
    };
  } else {
    return babel.transform({ filename, options, src });
  }
};

const THIS_FILE = fs.readFileSync(__filename);

export let getCacheKey: CacheKeyFn = (fileData, filename, configString) => {
  const cacheKeyParts = [
    THIS_FILE,
    fileData,
    filename,
    typescript.getCacheKey(),
    babel.getCacheKey(),
  ];

  const key = crypto.createHash('md5');
  cacheKeyParts.forEach((part) => key.update(part));
  return key.digest('hex');
};
