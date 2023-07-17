import type { Program } from "../types/AST";
import { explicitNewcounts } from "./explicitNewcounts";
import { mapNames } from "./mapNames";

export const transforms = [
  { name: "explicit-newcounts", transform: explicitNewcounts },
  { name: "map-names", transform: mapNames },
] as const;

export type Transform = (typeof transforms)[number]["name"];

export type GolfOpts = Record<Transform, boolean>;

export function golfAST(program: Program, golfOpts: GolfOpts): Program {
  for (const { name, transform } of transforms) {
    if (golfOpts[name]) program = transform(program);
  }
  return program;
}
