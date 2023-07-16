import { detokenize } from "./emit/detokenize";
import { emitTokens } from "./emit/emitTokens";
import { golfAST } from "./golf/golfAST";
import type { ParseOpts } from "./parse/Parser";
import { parse } from "./parse/Parser";
import type { Program } from "./types/AST";

export function golf(tex: string, opts: ParseOpts): string {
  const program = parse(tex, opts);
  const golfed = golfAST(program);
  return emitString(golfed);
}

function emitString(program: Program): string {
  return detokenize(emitTokens(program));
}
