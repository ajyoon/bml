const indefinite = require('indefinite');

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

// Note the 3 dashes here are the different kinds, not the same character
const MISPLACED_WORD_ENDING_PUNC_RE = /([a-zA-Z0-9\xA0-\uFFFF])(\s+)([.,:;!?\-\–\—]+)/g;

/**
 * Performs simple English-like correction of whitespace around
 * punctuation marks.
 *
 * - snap [, . : ; ! ?] to the end of preceding words when separated
 *   by whitespace (including line breaks.)
 */
export function punctuationCleanup(text: string): string {
  return text.replace(MISPLACED_WORD_ENDING_PUNC_RE, '$1$3$2');
}


// \p{Ll} matches unicode lowercase letters which have uppercase variants.
const INCORRECT_CAPS_RE = /([.!?]["'_]?\s+|^\s*)(\p{Ll})/gu;


/**
 * Tries to correct capitalization of the first words of sentences.
 *
 * This automatically capitalizes the first letter of the first word
 * following a sentence-ending punctuation mark.
 */
export function capitalizationCleanup(text: string): string {
  // Conforms to `text.replace` replacer function interface
  function correctCaps(_match: string, p1: string, p2: string) {
    return p1 + p2.toUpperCase();
  }

  return text.replace(INCORRECT_CAPS_RE, correctCaps);
}

const VISUAL_LINE_BREAK_RE = /\\ *(\r?\n|\r)[ \t]*/g

export function replaceVisualLineBreaks(text: string): string {
  return text.replace(VISUAL_LINE_BREAK_RE, ' ');
}

const INDEFINITE_ARTICLE_RE = /\b(a|an) ([\p{L}0-9]+)\b/igu

/**
 * Attempt to correct English indefinite articles (a / an)
 */
export function correctIndefiniteArticles(text: string) {
  function upcaseFirstLetter(s: string): string {
    if (s.length === 0) {
      return s;
    } else if (s.length === 1) {
      return s.toUpperCase();
    } else {
      return s[0].toUpperCase() + s.slice(1);
    }
  }
  // Conforms to `text.replace` replacer function interface
  function correctArticle(_match: string, originalArticle: string, word: string) {
    let article = indefinite(word, { articleOnly: true });
    if (originalArticle === 'a' || originalArticle === 'an') {
      return article + ' ' + word;
    } else if (originalArticle === 'A' || originalArticle === 'An') {
      return upcaseFirstLetter(article) + ' ' + word;
    } else {
      // All caps
      return article.toUpperCase() + ' ' + word;
    }
  }

  return text.replace(INDEFINITE_ARTICLE_RE, correctArticle);
}
