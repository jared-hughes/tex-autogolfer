import type { Program } from "../types/AST";
import { explicitNewcounts } from "./explicitNewcounts";
import { mapNames } from "./mapNames";

export function golfAST(program: Program): Program {
  return mapNames(explicitNewcounts(program));
}
