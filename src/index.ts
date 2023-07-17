import { detokenize } from "./emit/detokenize";
import { emitTokens } from "./emit/emitTokens";
import { golfAST, GolfOpts } from "./golf/golfAST";
import { ParseOpts, parse } from "./parse/Parser";
import { Program } from "./types/AST";

export type Opts = ParseOpts & GolfOpts;

export function golf(tex: string, opts: Opts): string {
  const program = parse(tex, opts);
  const golfed = golfAST(program, opts);
  return emitString(golfed);
}

function emitString(program: Program): string {
  return detokenize(emitTokens(program));
}
