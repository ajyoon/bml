import { TokenType } from './tokenType';

export class Token {

  tokenType: TokenType;
  index: number;
  str: string;

  constructor(tokenType: TokenType, index: number, str: string) {
    this.tokenType = tokenType;
    this.index = index;
    this.str = str;
  }

  toString(): string {
    return `Token{tokenType: ${this.tokenType}, index: ${this.index}, `
      + `string: '${this.str}'}`;
  }
}
