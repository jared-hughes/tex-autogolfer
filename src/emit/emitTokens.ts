import type { Child, Program } from "../types/AST";
import type { EmitToken } from "./EmitToken";

export function emitTokens(ast: Program): readonly EmitToken[] {
  return ast.children.flatMap((c) => [...emit(c)]);
}

function* emit(node: Child): Generator<EmitToken, void> {
  switch (node.type) {
    case "Control":
    case "Other":
    case "Space":
    case "SepSpace":
    case "Newline":
      yield node;
      break;
    case "Group":
      yield { type: "Other", value: "{" };
      for (const child of node.children) yield* emit(child);
      yield { type: "Other", value: "}" };
      break;
    default:
      node satisfies never;
  }
}
