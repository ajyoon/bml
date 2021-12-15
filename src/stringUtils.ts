function lineAndColumnOf(str: string, index: number): { line: number, column: number } {
  if (index > str.length) {
    throw new Error('charIndex > string.length');
  }
  let line = 1;
  let column = -1;
  let newLine = false;
  for (let i = 0; i <= index; i++) {
    if (newLine) {
      line++;
      column = 0;
      newLine = false;
    } else {
      column++;
    }
    if (str[i] === '\n') {
      newLine = true;
    }
  }
  return { line: line, column: column };
}

function lineColumnString(str: string, index: number): string {
  let lineAndColumn = lineAndColumnOf(str, index);
  return 'line: ' + lineAndColumn.line + ', column: ' + lineAndColumn.column;
}

function isWhitespace(str: string): boolean {
  return str.trim() === '';
}

/* Escape all regex-special characters in a string */
function escapeRegExp(str: string): string {
  return str.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
}

exports.lineAndColumnOf = lineAndColumnOf;
exports.lineColumnString = lineColumnString;
exports.isWhitespace = isWhitespace;
exports.escapeRegExp = escapeRegExp;
