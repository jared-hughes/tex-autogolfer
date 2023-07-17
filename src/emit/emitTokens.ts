import { Child, Node } from "../types/AST";
import { EmitToken } from "../types/TokenValue";

export function emitTokens(node: Node): readonly EmitToken[] {
  return [...emit(node)];
}

function* emit(node: Node): Generator<EmitToken, void> {
  switch (node.type) {
    case "Control":
    case "Other":
    case "Space":
    case "NumSep":
    case "Newline":
      yield node;
      break;
    case "Program":
      yield* emitAll(node.children);
      break;
    case "Group":
      yield { type: "Begin" };
      yield* emitAll(node.children);
      yield { type: "End" };
      break;
    case "Def":
      yield* emit(node.callee);
      yield* emit(node.binding);
      yield* emitAll(node.params);
      yield { type: "Begin" };
      yield* emitAll(node.body);
      yield { type: "End" };
      break;
    case "Let":
      yield* emit(node.callee);
      yield* emit(node.binding);
      yield* emit(node.rhs);
      break;
    case "Newcount":
      yield* emit(node.callee);
      yield* emit(node.binding);
      break;
    default:
      node satisfies never;
  }
}

function* emitAll(nodes: Child[]): Generator<EmitToken, void> {
  for (const child of nodes) yield* emit(child);
}
