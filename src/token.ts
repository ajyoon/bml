import { TokenType } from './tokenType';

export class Token {

  tokenType: TokenType;
  /** Index of the first character of this token in the string */
  index: number;
  /** Index after the last character of this token in the string (exclusive bound) */
  endIndex: number;
  /**
   * Output string for the token.
   *
   * This may not always be the same as the input text consumed by the token.
   * For example, escape sequences like `\{` will have `token.str === '{'`.
   */
  str: string;

  constructor(tokenType: TokenType, index: number, endIndex: number, str: string) {
    this.tokenType = tokenType;
    this.index = index;
    this.endIndex = endIndex;
    this.str = str;
  }

  toString(): string {
    return `Token{tokenType: ${this.tokenType}, index: ${this.index}, `
      + `endIndex: ${this.endIndex}, string: '${this.str}'}`;
  }
}
