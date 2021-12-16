// This file contains type declarations for dependencies

declare module 'marked' {
  function marked(markdownString: string, options?: object, callback?: Function): string;
  export = marked;
}

declare module 'seedrandom' {
  // The actual seedrandom declaration is much more complicated than
  // this - but this simplified interface is all we use.
  type RNGFunc = () => number;
  function seedrandom(seed?: number): RNGFunc;
  export = seedrandom;
}
