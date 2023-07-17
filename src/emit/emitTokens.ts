import type { Child, Program } from "../types/AST";
import type { EmitToken } from "../types/TokenValue";

export function emitTokens(ast: Program): readonly EmitToken[] {
  return [...emitAll(ast.children)];
}

function* emit(node: Child): Generator<EmitToken, void> {
  switch (node.type) {
    case "Control":
    case "Other":
    case "Space":
    case "NumSep":
    case "Newline":
      yield node;
      break;
    case "NumSepAuto":
      yield { type: "NumSep" };
      break;
    case "Group":
      yield { type: "Begin" };
      yield* emitAll(node.children);
      yield { type: "End" };
      break;
    case "Def":
      yield { type: "Control", value: "\\def" };
      yield* emit(node.binding);
      yield* emitAll(node.params);
      yield { type: "Begin" };
      yield* emitAll(node.body);
      yield { type: "End" };
      break;
    case "Let":
      yield { type: "Control", value: "\\let" };
      yield* emit(node.binding);
      yield* emit(node.rhs);
      break;
    case "Newcount":
      yield { type: "Control", value: "\\newcount" };
      yield* emit(node.binding);
      break;
    default:
      node satisfies never;
  }
}

function* emitAll(nodes: Child[]): Generator<EmitToken, void> {
  for (const child of nodes) yield* emit(child);
}
