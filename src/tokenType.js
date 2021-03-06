const TokenType = Object.freeze({
  WHITESPACE: Symbol('WHITESPACE'),
  NEW_LINE: Symbol('NEW_LINE'),
  COMMENT: Symbol('COMMENT'),
  OPEN_BLOCK_COMMENT: Symbol('OPEN_BLOCK_COMMENT'),
  CLOSE_BLOCK_COMMENT: Symbol('CLOSE_BLOCK_COMMENT'),
  SLASH: Symbol('SLASH'),
  ASTERISK: Symbol('ASTERISK'),
  SINGLE_QUOTE: Symbol('SINGLE_QUOTE'),
  DOUBLE_QUOTE: Symbol('DOUBLE_QUOTE'),
  BACKTICK: Symbol('BACKTICK'),
  LETTER_R: Symbol('LETTER_R'),
  OPEN_PAREN: Symbol('OPEN_PAREN'),
  CLOSE_PAREN: Symbol('CLOSE_PAREN'),
  OPEN_BRACE: Symbol('OPEN_BRACE'),
  CLOSE_BRACE: Symbol('CLOSE_BRACE'),
  COMMA: Symbol('COMMA'),
  KW_AS: Symbol('KW_AS'),
  KW_CALL: Symbol('KW_CALL'),
  KW_EVAL: Symbol('KW_EVAL'),
  KW_MODE: Symbol('KW_MODE'),
  KW_USE: Symbol('KW_USE'),
  NUMBER: Symbol('NUMBER'),
  TEXT: Symbol('TEXT')
});
exports.TokenType = TokenType;
