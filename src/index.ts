import { detokenize } from "./emit/detokenize";
import { emitTokens } from "./emit/emitTokens";
import { golfAST } from "./golf/golfAST";
import { ParseOpts, parse } from "./parse/Parser";
import { Node } from "./types/AST";

export type Opts = ParseOpts;

export function golf(tex: string, opts: Opts): string {
  const program = parse(tex, opts);
  const golfed = golfAST(program);
  return emitString(golfed);
}

export function emitString(node: Node): string {
  return detokenize(emitTokens(node));
}
