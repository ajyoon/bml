import * as evalApi from './evalApi';

const evalFuncTemplate = `
  const bml = this;

  let __output = '';

  function insert(str) {
    __output += str;
  }

  ////////// start user code

  ***USER CODE SLOT***

  ////////// end user code

  return __output;
`;


export class EvalBlock {
  contents: string;

  constructor(contents: string) {
    this.contents = contents;
  }

  toString(): string {
    return `EvalBlock('${this.contents}')`;
  }

  toFunc(): Function {
    let funcSrc = evalFuncTemplate.replace('***USER CODE SLOT***', this.contents);
    return new Function(funcSrc).bind(evalApi.api);
  }

  execute(): string {
    return this.toFunc()();
  }
}

