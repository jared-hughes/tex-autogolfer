import type { Child, Group, Program } from "../types/AST";
import { Lexer, pos } from "./Lexer";

export function parse(tex: string): Program {
  tex = tex.trimEnd();
  const parser = new Parser(tex);
  return parser.parseProgram();
}

class Parser extends Lexer {
  parseProgram(): Program {
    const children = this.parseInner();
    this.consumeType("eof");
    return { type: "Program", children };
  }

  parseGroup(): Group {
    // Already consumed a "begin"
    const children = this.parseInner();
    this.consumeType("end");
    return { type: "Group", children };
  }

  parseInner(): Child[] {
    const children = [];
    while (true) {
      const pt = this.peek().type;
      if (pt === "eof" || pt === "end") return children;
      const next = this.parseSingle();
      if (next) children.push(next);
    }
  }

  parseSingle(): Child | undefined {
    const peek = this.consume();
    switch (peek.type) {
      case "begin":
        return this.parseGroup();
      case "end":
        throw this.pushFatalError("Unmatched '}'.", pos(peek));
      case "newline":
        return { type: "Newline" };
      case "other":
        return { type: "Other", value: peek.value };
      case "forced_output_space":
        return { type: "Space" };
      case "forced_code_space":
        return { type: "SepSpace" };
      case "symb_control":
        return { type: "Control", value: peek.value, variant: "symb" };
      case "word_control":
        return { type: "Control", value: peek.value, variant: "word" };
      case "eof":
      case "space":
      case "comment":
        break;
      default:
        peek.type satisfies never;
    }
  }
}
