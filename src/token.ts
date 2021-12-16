import { TokenType } from './tokenType';

export class Token {

  tokenType: TokenType;
  index: number;
  string: string;

  constructor(tokenType: TokenType, index: number, string: string) {
    this.tokenType = tokenType;
    this.index = index;
    this.string = string;
  }

  toString(): string {
    return `Token{tokenType: ${this.tokenType}, index: ${this.index}, `
      + `string: '${this.string}'}`;
  }
}
