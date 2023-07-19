import { Control, EmitToken } from "../types/TokenValue";
import { golfError } from "../types/diagnostics";

export function detokenize(tokens: readonly EmitToken[]): string {
  let s = "";
  let prev: EmitToken | undefined;
  tokens = mergeNumSepSpace(tokens);
  for (const token of tokens) {
    s += value(token, prev);
    prev = token;
  }
  return s;
}

// Replace `⫽⫽␣` with `\ `
function mergeNumSepSpace(tokens: readonly EmitToken[]) {
  const out: EmitToken[] = [];
  for (let i = 0; i < tokens.length; ) {
    if (tokens[i].type === "NumSep" && tokens[i + 1]?.type === "Space") {
      out.push({ type: "Control", value: "\\ " });
      i += 2;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out;
}

function value(token: EmitToken, prev: EmitToken | undefined): string {
  const prevWordControl =
    prev && prev.type === "Control" && getVariant(prev) === "word";
  switch (token.type) {
    case "Space":
      if (prevWordControl) return "\\ ";
      return " ";
    case "NumSep":
      if (prevWordControl) return "{}";
      return " ";
    case "Newline":
      return "\n\n";
    case "Control":
    case "Other":
      if (prevWordControl && /^[a-zA-Z]/.test(token.value))
        return " " + token.value;
      return token.value;
    case "Begin":
      return "{";
    case "End":
      return "}";
    default:
      token satisfies never;
      return "";
  }
}

function getVariant(token: Control) {
  const s = token.value;
  if (s.length === 0) throw new Error("Programming error: 0-length id.");
  if (s.length === 1) return "active";
  if (/^\\[a-zA-Z]+$/.test(s)) return "word";
  if (/^\\.$/.test(s)) return "symb";
  golfError(`Invalid id ${s}`);
}
