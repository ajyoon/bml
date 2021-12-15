// This file contains type declarations for dependencies
// whose declarations are not pulled in via DefinitelyTyped (@type/xyz in package.json)

declare module 'marked' {
  function marked(markdownString: string, options?: object, callback?: Function): string;
  export = marked;
}
