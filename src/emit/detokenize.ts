import type { EmitToken } from "./EmitToken";

export function detokenize(tokens: readonly EmitToken[]): string {
  let s = "";
  let prev: EmitToken | undefined;
  for (const token of tokens) {
    s += value(token, prev);
    prev = token;
  }
  return s;
}

function value(token: EmitToken, prev: EmitToken | undefined): string {
  const prevWordControl =
    prev && prev.type === "Control" && prev.variant === "word";
  switch (token.type) {
    case "Space":
      if (prevWordControl) return "\\ ";
      return " ";
    case "SepSpace":
      if (prevWordControl) return "{}";
      return " ";
    case "Newline":
      return "\n\n";
    case "Control":
    case "Other":
      if (prevWordControl && /^[a-zA-Z]/.test(token.value))
        return " " + token.value;
      return token.value;
    default:
      token satisfies never;
      return "";
  }
}
