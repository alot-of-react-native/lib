# @alot/jest-preset

Test your code using Jest with tests written in TypeScript.

## Usage

 1. Add as a dependency:

       yarn add --dev @alot/jest-preset

 2. Create a `tsconfig.json` configuration in your app root if you haven't
    already, for example:

    ```json
    {
      "compilerOptions": {
        "target": "es2015",
        "jsx": "react",
        "noEmit": true,
        "moduleResolution": "node"
      },
      "exclude": [
        "node_modules"
      ]
    }
    ```

  3. Modify your `package.json` or other Jest configuration to use this preset:

  `package.json` example:

  ```diff
    {
  + "jest": {
  +    "preset": "@alot/jest-preset",
  +   ...
    }
    ```

  4. That's it!
