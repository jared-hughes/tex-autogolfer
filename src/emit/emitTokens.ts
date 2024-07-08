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
      yield* emitGroup(node.children);
      break;
    case "Usegolf":
      yield { type: "Control", value: "\\usegolf" };
      yield* emitGroup(node.children);
      break;
    case "Def":
      yield* emit(node.callee);
      yield* emit(node.binding);
      yield* emitAll(node.params);
      yield* emitGroup(node.body);
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
    case "CounterIndex":
      throw new Error(
        "Missing \\usegolf{count}. Expected due to `♯` in source file."
      );
    default:
      node satisfies never;
  }
}

function* emitAll(nodes: Child[]): Generator<EmitToken, void> {
  for (const child of nodes) yield* emit(child);
}

function* emitGroup(nodes: Child[]): Generator<EmitToken, void> {
  yield { type: "Begin" };
  yield* emitAll(nodes);
  yield { type: "End" };
}
