@builtin "number.ne"
@builtin "whitespace.ne"

@{%
function isStr(obj) {
	return obj instanceof String || typeof obj === "string";
}

class ChoiceOption {
	constructor(runs, weight) {
		this.runs = runs;
		this.weight = weight;
	}
}

class Choice {
	constructor(id, options, isSilent) {
		this.options = options;
		this.id = id;
		this.isSilent = isSilent;
		
	}
}

class ChoiceReferenceDeclaration {
	constructor(id, isSilent) {
		this.id = id;
		this.isSilent = isSilent;
	}
}

class ChoiceReferenceBackRef {
	constructor(id) {
		this.id = id;
	}
}

function processChoiceBlock(m) {
	let bodyArray = m[2];
	let weight = null;
	if (m.length >= 7) {
		weight = m[6]
	}
	let bodyRuns = [];
	bodyArray.forEach((entry) => {
		let lastRun = bodyRuns[bodyRuns.length - 1];
		if (isStr(entry) && isStr(lastRun)) {
			bodyRuns[bodyRuns.length - 1] = lastRun + entry;
		} else {
			bodyRuns.push(entry);
		}
	});
	return new ChoiceOption(bodyRuns, weight);
}

function processChoice(m) {
	let options = [];
	let referenceDeclId = null;
	let referenceDeclIsSilent = false;
	if (m[2]) {
		referenceDeclId = m[2][0].id;
		referenceDeclIsSilent = m[2][0].isSilent;
	}
	let firstOption = m[4];
	let laterOptionsRawArray = m[5];
	if (firstOption) {
		options.push(firstOption);
	}
	laterOptionsRawArray.forEach((subArr) => {
		options.push(subArr[3]);
	});
	return new Choice(referenceDeclId, options, referenceDeclIsSilent);
}

function processChoiceReferenceDeclaration(m) {
	return new ChoiceReferenceDeclaration(m[0], false);
}

function processChoiceReferenceSilentDeclaration(m) {
	return new ChoiceReferenceDeclaration(m[1], true);
}

function processChoiceReferenceBackRef(m) {
	return new ChoiceReferenceBackRef(m[1]);
}

class EvalBlock {
	constructor(source) {
		this.source = source;
	}
}
%}

mainNodes -> mainNode:+
mainNode ->
	plaintext {% id %}
	| choiceBlock {% id %}
	| backRefBlockWithoutMapping {% id %}
	| backRefBlockWithMapping {% id %}
	| eval {% id %}


# A run of plain text
# Note this will need to be adjusted to support brace-blocks inside
# matching plaintext parens
plaintext -> [^){] {% id %} | matchingParenInPlaintext {% id %}
matchingParenInPlaintext -> "(" ( [^){] | matchingParenInPlaintext ):* ")"


# Basic choice blocks, including those with reference ids and silent choice blocks
choiceBlock -> "{" _ (choiceReferenceDeclaration | choiceReferenceSilentDeclaration):? _
	choiceOption (_ "," _ choiceOption):* _ "}"
	{% processChoice %}
choiceOption -> "(" _ choiceOptionChar:* _ ")" _ decimal:?
	{% processChoiceBlock %}
choiceOptionWithoutWeight -> "(" _ choiceOptionChar:* _ ")"
	{% processChoiceBlock %}

choiceOptionChar -> [^){] {% id %}
    | "\\" choiceOptionCharEscape
        {% function(d) { return JSON.parse("\""+d.join("")+"\""); } %}
    | "\\)"
        {% function(d) {return "'"; } %}
    | choiceBlock

choiceOptionCharEscape -> [\\nrt] {% id %}
    | "u" [a-fA-F0-9] [a-fA-F0-9] [a-fA-F0-9] [a-fA-F0-9] {%
    function(d) {
        return d.join("");
    }
%}

# Bare backrefs which copy the result of the referred choice, e.g. {@foo}
backRefBlockWithoutMapping -> "{" _ choiceReferenceBackRef _ "}"
	{% (m) => { return new ChoiceReferenceBackRef(m[2].id); } %}

# Mapped backrefs, e.g. {@foo: 0 -> (bar), 1 -> (biz), (baz)}
maybeMappedOption ->
	unsigned_int _ "->" _ choiceOptionWithoutWeight
	| choiceOption
backRefBlockWithMapping -> "{" _ choiceReferenceBackRef ":" _ maybeMappedOption ( _ "," _ maybeMappedOption ):* _ "}"
	
choiceReferenceBackRef -> "@" choiceReferenceId {% processChoiceReferenceBackRef %}

choiceReferenceId -> [\w_]:+ {% function(d) { return d[0].join("") } %}
choiceReferenceDeclaration -> choiceReferenceId ":" {% processChoiceReferenceDeclaration %}
choiceReferenceSilentDeclaration -> "#" choiceReferenceId ":" {% processChoiceReferenceSilentDeclaration %}


# Note this will fail to properly parse some javascript edge cases where
# non-syntactical braces appear in comments and strings.
eval -> "{{" ( [^{] | matchingBraceInEval ):* "}}" {%
	function (d) {return new EvalBlock(d[1].flat(Infinity).join("")) }
%}

matchingBraceInEval -> "{" ( [^{] | matchingBraceInEval ):* "}"



