const TokenType = Object.freeze({
  WHITESPACE: Symbol('WHITESPACE'),
  NEWLINE: Symbol('NEW_LINE'),
  COMMENT: Symbol('COMMENT'),
  SINGLE_QUOTE: Symbol('SINGLE_QUOTE'),
  LETTER_R: Symbol('LETTER_R'),
  OPEN_PAREN: Symbol('OPEN_PAREN'),
  CLOSE_PAREN: Symbol('CLOSE_PAREN'),
  OPEN_BRACE: Symbol('OPEN_BRACE'),
  CLOSE_BRACE: Symbol('CLOSE_BRACE'),
  COMMA: Symbol('COMMA'),
  KW_AS: Symbol('KW_AS'),
  KW_CALL: Symbol('KW_CALL'),
  KW_EVALULATE: Symbol('KW_EVALULATE'),
  KW_MODE: Symbol('KW_MODE'),
  KW_BEGIN: Symbol('KW_BEGIN'),
  KW_USE: Symbol('KW_USE'),
  NUMBER: Symbol('NUMBER'),
  TEXT: Symbol('TEXT')
});
exports.TokenType = TokenType;
