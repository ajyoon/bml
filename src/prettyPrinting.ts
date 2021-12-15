export function prettyPrintArray(array: any[]) {
  if (array.length == 0) {
    return '[]';
  }
  return `[${array.join(', ')}]`;
}

