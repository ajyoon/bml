import marked from 'marked';

const BLANK_LINE_RE = /^\s*$/;
const TRAILING_WHITESPACE_RE = /\s+$/;

/**
 * Cleans whitespace in the given text by:
 * 1. Removing all trailing whitespace in every line
 * 2. Collapsing any runs of over 1 blank line
 * 3. Collapsing any runs of over 1 space in the middle of a line.
 * 4. Removing blank lines at the start of the text
 * 5. Ensuring the text ends with a single line break
 */
export function whitespaceCleanup(text: string): string {
  let out = '';
  let atDocStart = true;
  let lastLineWasBlank = false;
  for (let line of text.split('\n')) {
    let isBlank = BLANK_LINE_RE.test(line);

    if (atDocStart) {
      if (isBlank) {
        // Skip blank lines at start of document
        continue;
      } else {
        atDocStart = false;
      }
    }

    if (isBlank) {
      if (lastLineWasBlank) {
        // Skip runs of blank lines
        continue;
      }
      // Lines consisting of only whitespace should
      // become simply blank lines
      line = '';
    } else {
      // intra-line cleanups
      line = line.replace(TRAILING_WHITESPACE_RE, '');
      let rewrittenLine = '';
      let atLineStart = true;
      let lastCharWasSpace = false;
      for (let char of line) {
        let charIsSpace = char === ' ';
        if (!atLineStart && lastCharWasSpace && charIsSpace) {
          continue;
        } else {
          if (!charIsSpace) {
            atLineStart = false;
          }
          rewrittenLine += char;
          lastCharWasSpace = charIsSpace;
        }
      }
      line = rewrittenLine;
    }

    lastLineWasBlank = isBlank;

    out += line + '\n';
  }

  // Edge case: if input ended with a line break already, above code
  // will result in \n\n ending the output. Correct this so output
  // always terminates with a single \n
  if (out.endsWith('\n\n')) {
    out = out.substring(0, out.length - 1);
  }

  return out;
}

/**
 * Performs simple English-like correction of whitespace around
 * punctuation marks.
 */
export function punctuationSpacingCleanup(text: string): string {
  return '';
}

export function renderMarkdown(text: string, markedSettings: object) {
  return marked(text, markedSettings);
}
