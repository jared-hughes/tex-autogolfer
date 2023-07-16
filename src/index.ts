import { detokenize } from "./emit/detokenize";
import { emitTokens } from "./emit/emitTokens";
import { golfAST } from "./golf/golfAST";
import { parse } from "./parse/Parser";
import type { Program } from "./types/AST";

export function golf(tex: string): string {
  const program = parse(tex);
  const golfed = golfAST(program);
  return emitString(golfed);
}

function emitString(program: Program): string {
  return detokenize(emitTokens(program));
}
