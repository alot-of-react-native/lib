import * as fs from 'fs';
import * as path from 'path';

import * as appRootPath from 'app-root-path';
appRootPath.setPath(path.join(__dirname, '..'));

const FIXTURES = path.join(__dirname, '__fixtures__');

describe('@alot/transformer', () => {
  fs.readdirSync(FIXTURES).forEach((fixture_dir) => {
    const dirname = path.join(FIXTURES, fixture_dir);
    const failureMapFile = path.join(dirname, 'failuremap.json');
    process.env.PLATFORM_TARGET = path.join('tests', '__fixtures__', fixture_dir);
    const transformer = require('../dist');
    if (fs.statSync(dirname).isDirectory()) {
      let failureMap: { [key: string]: string } = {};
      if (fs.existsSync(failureMapFile) && fs.statSync(failureMapFile)) {
        failureMap = require(failureMapFile);
      }
      fs.readdirSync(dirname).forEach((fixture) => {
        if (fixture.match('.json$')) {
          return;
        }
        const filename = path.join(FIXTURES, fixture_dir, fixture);
        if (fs.statSync(filename).isFile()) {
          const src = fs.readFileSync(filename, { encoding: 'utf8' });
          if (failureMap[fixture]) {
            it (`throws error on ${fixture_dir}/${fixture}`, () => {
              try {
                const result = transformer.transform({src, filename, options: {}});
              } catch (err) {
                expect(err.message).toMatch(failureMap[fixture]);
              }
            });
          } else {
            it(`transpiles ${fixture_dir}/${fixture}`, () => {
              const result = transformer.transform({src, filename, options: {}});
              expect(result.code).toMatchSnapshot();
              delete result.map.sources;
              expect(result.map).toMatchSnapshot();
            });
          }
        }
      });
    }
  });
});
