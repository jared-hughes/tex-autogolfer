import { Program } from "../types/AST";
import { count } from "./count";
import { rename } from "./rename";
import { rebind } from "./rebind";
import { splitCompactMap, trimStart } from "./traversal";
import { emitString } from "..";

export const transforms = [
  { name: "count", transform: count },
  { name: "rebind", transform: rebind, always: true },
  { name: "rename", transform: rename },
];

export function golfAST(program: Program): Program {
  for (const { name, transform, always } of transforms) {
    const { satisfy, unsatisfy } = splitCompactMap(
      program.golfs,
      (v) => trimStart(v, name)?.length === 0
    );
    if (satisfy.length > 0 || always) {
      program = transform({ ...program, golfs: unsatisfy });
    }
  }
  if (program.golfs.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      "Warning: unknown golfs:\n" +
        program.golfs
          .map(
            (children) =>
              "  \\usegolf" + emitString({ type: "Group", children })
          )
          .join("\n")
    );
  }
  return program;
}
