import marked from 'marked';

/**
 * Cleans whitespace in the given text by:
 * 1. Removing all trailing whitespace in every line
 * 2. Collapsing any runs of over 1 blank line into just 1
 * 3. Removing blank lines at the start of the text
 * 4. Ensuring the text ends with a single line break
 */
export function whitespaceCleanup(text: string): string {
  let out = text;
  // Append a line break (if this is redundant it will be cleaned up)
  out += '\n';
  // Strip all leading whitespace (from beginning only)
  out = out.replace(/^\s+/, '');
  // Strip all trailing whitespace (from end only) except 1 blank line
  out = out.replace(/\s+$/, '\n');
  // Remove trailing whitespace from each individual line
  out = out.replace(/[^\S\r\n]+$/m, '');
  // Collapse any run of >1 blank line to 1
  out = out.replace(/[\n]{3,}/, '\n\n');
  return out;
}

export function renderMarkdown(text: string, markedSettings: object) {
  return marked(text, markedSettings);
}
