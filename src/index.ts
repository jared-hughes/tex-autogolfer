import { detokenize } from "./emit/detokenize";
import { emitTokens } from "./emit/emitTokens";
import { golfAST } from "./golf/golfAST";
import type { ParseOpts } from "./parse/Parser";
import type { GolfOpts } from "./golf/golfAST";
import { parse } from "./parse/Parser";
import type { Program } from "./types/AST";

export type Opts = ParseOpts & GolfOpts;

export function golf(tex: string, opts: Opts): string {
  const program = parse(tex, opts);
  const golfed = golfAST(program, opts);
  return emitString(golfed);
}

function emitString(program: Program): string {
  return detokenize(emitTokens(program));
}
