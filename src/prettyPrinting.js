function prettyPrintArray(array) {
  if (array.length == 0) {
    return '[]';
  }
  return `[${array.join(', ')}]`;
}


exports.prettyPrintArray = prettyPrintArray;
