import { parseDocument } from './parsers';
import { Lexer } from './lexer';
import { AstNode } from './ast';
import { ChoiceFork } from './choiceFork';
import { Reference } from './reference'
import { EvalBlock } from './evalBlock';

export type AnalysisResult = {
  possibleOutcomes: bigint
};

type ForkIdMap = Map<string, [ForkNode, ChoiceFork]>;

abstract class AnalysisNode {
}


class ForkNode extends AnalysisNode {
  id: string | null;
  branches: AnalysisTree[];
  referencedBy: RefNode[] = [];

  constructor(id: string | null = null, branches: AnalysisTree[] = []) {
    super();
    this.id = id;
    this.branches = branches;
  }

  countOutcomes(): bigint {
    let outcomes = BigInt(0);
    for (let branch of this.branches) {
      outcomes += countOutcomesForAnalysisTree(branch);
    }
    for (let ref of this.referencedBy) {
      outcomes += ref.countOutcomesAddedToReferredNode();
    }
    return outcomes;
  }
}

class RefNode extends AnalysisNode {
  forkNodeReferredTo: ForkNode;
  referenceMap: Map<number, AnalysisTree>;

  constructor(forkNodeReferredTo: ForkNode, referenceMap: Map<number, AnalysisTree>) {
    super();
    this.forkNodeReferredTo = forkNodeReferredTo;
    this.referenceMap = referenceMap;
  }

  countOutcomesAddedToReferredNode(): bigint {
    let outcomes = BigInt(0);
    for (let [_, value] of this.referenceMap.entries()) {
      // Mapped choices contribute 1 less than plain choices
      // because 1 has already been accounted for in the referenced fork
      outcomes += countOutcomesForAnalysisTree(value) - BigInt(1);
    }
    return outcomes;
  }
}



type AnalysisTree = AnalysisNode[]


function countOutcomesForAnalysisTree(tree: AnalysisTree): bigint {
  let outcomes = BigInt(1); // Base case is 1 for an empty tree
  for (let node of tree) {
    if (node instanceof ForkNode) {
      outcomes *= node.countOutcomes();
    }
    // branches added by ref nodes are resolved by their referred forks, so skip them.
  }
  return outcomes;
}


function deriveForkNode(choiceFork: ChoiceFork, forkIdMap: ForkIdMap): ForkNode {
  let forkNode = new ForkNode(choiceFork.identifier, []);
  if (forkNode.id) {
    forkIdMap.set(forkNode.id, [forkNode, choiceFork]);
  }
  for (let weight of choiceFork.weights) {
    let choice = weight.choice;
    if (choice instanceof EvalBlock) {
      forkNode.branches.push([])
    } else {
      let subTree = deriveAnalysisTree(choice, forkIdMap);
      forkNode.branches.push(subTree)
    }

  }
  return forkNode;
}

function deriveRefNode(ref: Reference, forkIdMap: ForkIdMap): RefNode {
  let forkMapLookupResult = forkIdMap.get(ref.id);
  if (!forkMapLookupResult) {
    // Handle unmapped refs gracefully - this is expected
    // for refs pointing to declarations in included files
    return new RefNode(new ForkNode(), new Map());
  }
  let forkNodeReferredTo = forkIdMap.get(ref.id)![0];
  let refNode = new RefNode(forkNodeReferredTo, new Map());
  forkNodeReferredTo.referencedBy.push(refNode);
  for (let [key, value] of ref.referenceMap.entries()) {
    let mappedValue: AnalysisTree;
    if (value instanceof EvalBlock) {
      mappedValue = [];
    } else {
      let subTree = deriveAnalysisTree(value, forkIdMap);
      mappedValue = subTree;
    }
    refNode.referenceMap.set(key, mappedValue);
  }
  // To make later analysis simple, create the implied mappings for the fallback fork
  if (ref.fallbackChoiceFork) {
    let fallbackForkNode = deriveForkNode(ref.fallbackChoiceFork, forkIdMap);
    let referredFork = forkIdMap.get(ref.id)![1];
    for (let i = 0; i < referredFork.weights.length; i++) {
      if (!refNode.referenceMap.has(i)) {
        refNode.referenceMap.set(i, [fallbackForkNode]);
      }
    }
  }
  return refNode;
}

function deriveAnalysisTree(ast: AstNode[], forkIdMap: ForkIdMap): AnalysisTree {
  let analysisTree: AnalysisTree = [];
  for (let node of ast) {
    if (node instanceof ChoiceFork) {
      analysisTree.push(deriveForkNode(node, forkIdMap));
    } else if (node instanceof Reference) {
      analysisTree.push(deriveRefNode(node, forkIdMap));
    }
    // string nodes add no branches, so they are removed from the analysis tree
  }
  return analysisTree;
}




/**
 * Analyze a BML document without executing it
 * 
 * This does a rough back-of-the-envelope approximation of the number of possible
 * branches through the document. It has several shortcomings, especially when dealing
 * with refs and silent forks.
 *
 * Note that if your document contains cyclical reference loops, this will hang.
 */
export function analyze(bmlDocument: string): AnalysisResult {
  let lexer = new Lexer(bmlDocument);
  let ast = parseDocument(lexer, true);
  let analysisTree = deriveAnalysisTree(ast, new Map());
  let possibleOutcomes = countOutcomesForAnalysisTree(analysisTree);
  return {
    possibleOutcomes
  };
}
