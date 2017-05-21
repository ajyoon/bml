function lineAndColumnOf(string, charIndex) {
  if (charIndex > string.length) {
    throw new Error('charIndex > string.length');
  }
  var line = 1;
  var column = -1;
  var newLine = false;
  for (var i = 0; i <= charIndex; i++) {
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
  var lineAndColumn = lineAndColumnOf(string, charIndex);
  return 'line: ' + lineAndColumn.line + ', column: ' + lineAndColumn.column;
}

exports.lineAndColumnOf = lineAndColumnOf;
exports.lineColumnString = lineColumnString;
