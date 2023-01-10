@builtin "number.ne"
@builtin "whitespace.ne"

@{%
function isStr(obj) {
    return obj instanceof String || typeof obj === "string";
}

class Branch {
    constructor(weight) {
        this.weight = weight;
    }
}

class TextBranch extends Branch {
    constructor(runs, weight) {
        super(weight);
        this.runs = runs;
    }
}

class Fork {
    constructor(id, options, isSilent) {
        this.options = options;
        this.id = id;
        this.isSilent = isSilent;
    }
}

class ForkIdDeclaration {
    constructor(id, isSilent) {
        this.id = id;
        this.isSilent = isSilent;
    }
}

class ForkRefId {
    constructor(id) {
        this.id = id;
    }
}

class Ref {
    constructor(id, map, fallbackBranches) {
        this.id = id;
        this.map = map;
        this.fallbackBranches = fallbackBranches;
    }
}


function processRef(m) {
    console.log(m);
    let id = m[2].id;
    let map = {};
    let fallbackBranches = [];
    function processRefBranch(arr) {
        if (arr.length === 5) {
            let key = arr[0];
            let value = arr[4];
            map[key] = value;
        } else {
            fallbackBranches.push(arr[0]);
        }
    }
    processRefBranch(m[5]);
    for (let laterBranchMatch of m[6]) {
        processRefBranch(laterBranchMatch[3]);
    }
    return new Ref(id, map, fallbackBranches);
}

function processTextBranch(m) {
    let bodyArray = m[2];
    let weight = null;
    if (m.length >= 7) {
        weight = m[6];
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
    return new TextBranch(bodyRuns, weight);
}

function processFork(m) {
    let branches = [];
    let forkId = null;
    let isSilent = false;
    if (m[2]) {
        forkId = m[2][0].id;
        isSilent = m[2][0].isSilent;
    }
    let firstBranch = m[4];
    let laterBranchesRawArray = m[5];
    if (firstBranch) {
        branches.push(firstBranch);
    }
    laterBranchesRawArray.forEach((subArr) => {
        branches.push(subArr[3]);
    });
    return new Fork(forkId, branches, isSilent);
}

function processForkIdDeclaration(m) {
    return new ForkIdDeclaration(m[0], false);
}

function processForkIdSilentDeclaration(m) {
    return new ForkIdDeclaration(m[1], true);
}

function processForkRefId(m) {
    return new ForkRefId(m[1]);
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
        | fork {% id %}
        | bareRef {% id %}
        | ref {% id %}


# A run of plain text
# Note this will need to be adjusted to support forks inside
# matching plaintext parens
plaintext -> [^){] {% id %} | matchingParenInPlaintext {% id %}
matchingParenInPlaintext -> "(" ( [^){] | matchingParenInPlaintext ):* ")"

# Fundamental fork blocks
fork -> "{" _ (forkIdDeclaration | forkIdDeclarationSilent):? _
        branch (_ "," _ branch):* _ "}"
        {% processFork %}
branch -> "(" _ textBranchChar:* _ ")" _ decimal:?
        {% processTextBranch %}
branchWithoutWeight -> "(" _ textBranchChar:* _ ")"
        {% processTextBranch %}

textBranchChar -> [^){] {% id %}
    | "\\" textBranchCharEscape
        {% function(d) { return JSON.parse("\""+d.join("")+"\""); } %}
    | "\\)"
        {% function(d) {return "'"; } %}
    | fork

textBranchCharEscape -> [\\nrt] {% id %}
    | "u" [a-fA-F0-9] [a-fA-F0-9] [a-fA-F0-9] [a-fA-F0-9] {%
    function(d) {
        return d.join("");
    }
%}

# Bare refs which copy the result of the referred fork, e.g. {@foo}
bareRef -> "{" _ forkRefId _ "}"
    {% (m) => { return new ForkRefId(m[2].id); } %}

# Mapped refs, e.g. {@foo: 0 -> (bar), 1 -> (biz), (baz)}
maybeMappedBranch ->
	unsigned_int _ "->" _ branchWithoutWeight
	| branch
ref -> "{" _ forkRefId ":" _ maybeMappedBranch ( _ "," _ maybeMappedBranch ):* _ "}"
    {% processRef %}

	
forkRefId -> "@" forkId {% processForkRefId %}

forkId -> [\w_]:+ {% function(d) { return d[0].join("") } %}
forkIdDeclaration -> forkId ":" {% processForkIdDeclaration %}
forkIdDeclarationSilent -> "#" forkId ":" {% processForkIdSilentDeclaration %}


# Note this will fail to properly parse some javascript edge cases where
# non-syntactical brackets appear in comments and strings.
eval -> "[" ( [^[] | matchingBracketInEval ):* "]" {%
	function (d) {return new EvalBlock(d[1].flat(Infinity).join("")) }
%}

matchingBracketInEval -> "[" ( [^[] | matchingBracketInEval ):* "]"


