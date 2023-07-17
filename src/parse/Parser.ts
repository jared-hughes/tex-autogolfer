import type { Child, Def, Group, Let, Newcount, Program } from "../types/AST";
import type { TokenType } from "../types/TokenValue";
import { Lexer } from "./Lexer";

export interface ParseOpts {
  preserveNewlines: boolean;
}

export function parse(tex: string, opts: ParseOpts): Program {
  tex = tex.trimEnd();
  const parser = new Parser(tex, opts);
  return parser.parseProgram();
}

class Parser extends Lexer {
  parseProgram(): Program {
    const children = this.parseUntil([]);
    this.consumeType("EOF");
    return { type: "Program", children };
  }

  parseGroup(): Group {
    // Already consumed a "begin"
    const children = this.parseUntil(["End"]);
    this.consumeType("End");
    return { type: "Group", children };
  }

  parseUntil(types: TokenType[]): Child[] {
    const children = [];
    while (true) {
      const pt = this.peek().type;
      if (pt === "EOF" || types.includes(pt)) return children;
      const next = this.parseSingle();
      if (next) children.push(next);
    }
  }

  parseSingle(): Child | undefined {
    const token = this.consume();
    switch (token.type) {
      case "Begin":
        return this.parseGroup();
      case "End":
        throw this.pushFatalError("Unmatched '}'.", token);
      case "Newline":
        return { type: "Newline" };
      case "Other":
        return { type: "Other", value: token.value };
      case "Space":
        return token;
      case "NumSepHint": {
        const len = token.value.length;
        if (len >= 3 || len === 0)
          this.pushWarning("Invalid num sep hint: must be '⫽' or '⫽⫽'", token);
        if (len === 1) return { type: "NumSepAuto" };
        else return { type: "NumSep" };
      }
      case "Control":
        if (token.value === "\\def") return this.parseDef();
        if (token.value === "\\let") return this.parseLet();
        if (token.value === "\\newcount") return this.parseNewcount();
        return token;
      case "EOF":
        break;
      default:
        token satisfies never;
    }
  }

  parseNumSepHint(): Child {
    // Already consumed a "⫽"
    const name = this.consumeType("Control");
    const params = this.parseUntil(["Begin", "End"]);
    this.consumeType("Begin");
    const body = this.parseUntil(["End"]);
    this.consumeType("End");
    return { type: "Def", binding: name, params, body };
  }

  parseDef(): Def {
    // Already consumed a "\def"
    const name = this.consumeType("Control");
    const params = this.parseUntil(["Begin", "End"]);
    this.consumeType("Begin");
    const body = this.parseUntil(["End"]);
    this.consumeType("End");
    return { type: "Def", binding: name, params, body };
  }

  parseLet(): Let {
    // Already consumed a "\let"
    const name = this.consumeType("Control");
    const rhs = this.consumeType("Control");
    return { type: "Let", binding: name, rhs };
  }

  parseNewcount(): Newcount {
    // Already consumed a "\newcount"
    const binding = this.consumeType("Control");
    return { type: "Newcount", binding };
  }
}
