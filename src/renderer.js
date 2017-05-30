/**
 * The main loop which processes the text component of a bml document.
 *
 * Iterates through the body of the text exactly once, applying rules
 * whenever a matching string is encountered. Rules are processed in
 * the order they are listed in the active mode's declaration.
 *
 * If markdown postprocessing is enabled, it will be called at the end
 * of rule processing.
 *
 * @returns {String} the rendered text.
 */
function renderText(string, startIndex) {
  var isEscaped = false;
  var inLiteralBlock = false;
  var out = '';
  var index = startIndex;
  var currentRule = null;
  var foundMatch = false;
  var replacement = null;
  while (index < string.length) {
    if (isEscaped) {
      isEscaped = false;
      out += string[index];
    } else if (inLiteralBlock) {
      if (string[index] == '>' && string[index + 1]) {
        inLiteralBlock = false;
        index += 2;
        continue;
      } else {
        out += string[index];
      }
    } else {
      if (string[index] == '\\') {
        isEscaped = true;
      } else if (string[index] == '<' && string[index + 1] == '<') {
        inLiteralBlock = true;
      } else {
        // Optimize me when extending to support regexps
        ruleLoop:
        for (var r = 0; r < activeMode.rules.length; r++) {
          currentRule = activeMode.rules[r];
          for (var m = 0; m < currentRule.matchers.length; m++) {
            if (string.indexOf(currentRule.matchers[m], index) == index) {
              replacement = currentRule.getReplacement(currentRule.matchers[m],
                                                string, index);
              if (replacement instanceof Function) {
                out += replacement(currentRule.matchers[m], string, index);
              } else {
                out += replacement;
              }
              index += currentRule.matchers[m].length;
              foundMatch = true;
              break ruleLoop;
            }
          }
        }
        if (foundMatch) {
          foundMatch = false;
          continue;
        } else {
          out += string[index];
        }
      }
    }
    index++;
  }

  if (settings.renderMarkdown) {
    out = marked(out);
  }
  return out;
}

exports.renderText = renderText;
