function lineAndColumnOf(string, charIndex) {
  if (charIndex > string.length) {
    throw new Error('charIndex > string.length');
  }
  let line = 1;
  let column = -1;
  let newLine = false;
  for (let i = 0; i <= charIndex; i++) {
    if (newLine) {
      line++;
      column = 0;
      newLine = false;
    } else {
      column++;
    }
    if (string[i] === '\n') {
      newLine = true;
    }
  }
  return {line: line, column: column};
}

function lineColumnString(string, charIndex) {
  let lineAndColumn = lineAndColumnOf(string, charIndex);
  return 'line: ' + lineAndColumn.line + ', column: ' + lineAndColumn.column;
}

function isWhitespace(string) {
  return string.trim() === '';
}

/* Escape all regex-special characters in a string */
function escapeRegExp(string) {
  return string.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
}

exports.lineAndColumnOf = lineAndColumnOf;
exports.lineColumnString = lineColumnString;
exports.isWhitespace = isWhitespace;
exports.escapeRegExp = escapeRegExp;
