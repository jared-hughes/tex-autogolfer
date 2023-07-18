import { Pos } from "./AST";

export interface Diagnostic {
  message: string;
  severity: "error" | "warning";
  pos: Pos;
}

export function error(message: string, pos: Pos): Diagnostic {
  return { severity: "error", message, pos };
}

export function warning(message: string, pos: Pos): Diagnostic {
  return { severity: "warning", message, pos };
}

export class DiagnosticsState {
  constructor(public input: string) {}

  pushError(message: string, pos: Pos) {
    const d = error(message, pos);
    printDiagnostic(this.input, d);
  }

  pushWarning(message: string, pos: Pos) {
    const d = warning(message, pos);
    printDiagnostic(this.input, d);
  }
}

/* eslint-disable no-console */
export function printDiagnostic(input: string, d: Diagnostic) {
  const prefix = d.severity === "error" ? "[error]" : "[warn]";
  console.error(`${prefix} ${d.message}`);
  const { from, to } = d.pos;
  const before = input.slice(from - 20, from);
  const after = input.slice(to, to + 20);
  const a = before.split("\n").at(-1) ?? "";
  const b = input.slice(from, to);
  const c = after.split("\n")[0] ?? "";
  console.error(`  ${a}${b}${c}`);
  const squiggle = "^" + "~".repeat(b.length > 1 ? b.length - 1 : 0);
  console.error(`  ${" ".repeat(a.length)}${squiggle}`);
}

/** Not related to the rest of the diagnostics in this file */
export class GolfError extends Error {}
export function golfError(msg: string): never {
  console.error("[error] " + msg);
  process.exit(1);
}
export function golfWarning(msg: string) {
  console.error("[warn] " + msg);
}
