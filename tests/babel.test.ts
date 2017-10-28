import * as fs from "fs";
import * as path from "path";

const testModules = (FIXTURE_DIR) => {
  fs.readdirSync(FIXTURE_DIR).forEach((fixture) => {
    it(`loads module ${fixture}`, async () => {
      expect.assertions(1);
      const filename = path.join(FIXTURE_DIR, fixture);
      if (fs.statSync(filename).isFile()) {
        const mod = require(filename);

        const success = mod.async
          ? await mod.async()
          : mod.success;
        expect(success).toEqual(42);
      }
    });
  });
};

describe('@alot/jest-preset transforms tests with Babel', () => {
  testModules(path.join(__dirname, '__babel__'));
});

describe('@alot/jest-preset transforms tests with TypeScript', () => {
  testModules(path.join(__dirname, '__typescript__'));
});
