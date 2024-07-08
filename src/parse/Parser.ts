import {
  Child,
  Def,
  Group,
  Let,
  Newcount,
  Program,
  Usegolf,
  control,
} from "../types/AST";
import { Control, TokenType } from "../types/TokenValue";
import { Lexer } from "./Lexer";

export interface ParseOpts {
  preserveNewlines: boolean;
  newlinePar: boolean;
}

export function parse(tex: string, opts: ParseOpts): Program {
  tex = tex.trimEnd();
  const parser = new Parser(tex, opts);
  return parser.parseProgram();
}

class Parser extends Lexer {
  insideUsegolf = false;

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
    const children: Child[] = [];
    while (true) {
      const pt = this.peek().type;
      if (pt === "EOF" || types.includes(pt)) return children;
      const next = this.parseSingle(children.at(-1));
      if (Array.isArray(next)) {
        children.splice(children.length - 1, 1, ...next);
      } else if (next) {
        children.push(next);
      }
    }
  }

  /** Returning Child means push that child.
   * Returning [Child] means replace the end of the child list with that child.
   * Returning undefined means skip. */
  parseSingle(prev: Child | undefined): Child | [Child] | undefined {
    const token = this.consume();
    switch (token.type) {
      case "Begin":
        return this.parseGroup();
      case "BeginAuto":
        return this.parseCounterAuto();
      case "CounterIndex": {
        const ctrl = this.consumeType("Control");
        return { type: "CounterIndex", value: ctrl.value };
      }
      case "End":
      case "EndAuto":
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
        if (len === 1) {
          if (!prev || prev.type !== "Control")
            throw this.pushFatalError(
              "'⫽' must be after a control sequence like \\x",
              token
            );
          return [{ ...prev, needsSpaceAfterIfCount: true }];
        } else {
          return { type: "NumSep" };
        }
      }
      case "Control": {
        let callee = control(token.value);
        if (this.peek().type === "Mapsto") {
          this.consume();
          const mapsto = this.consumeType("Control");
          callee = { ...callee, mapsto };
        }
        if (this.insideUsegolf) return callee;
        if (
          !token.afterExpandafter &&
          ["\\def", "\\edef", "\\gdef", "\\xdef"].includes(callee.value)
        )
          return this.parseDef(callee);
        if (callee.value === "\\let") return this.parseLet(callee);
        if (callee.value === "\\newcount") return this.parseNewcount(callee);
        if (callee.value === "\\usegolf") return this.parseUsegolf();
        return callee;
      }
      case "Mapsto": {
        this.pushError("'↦' must be preceded by a control sequence.", token);
        if (this.peek().type === "Control") this.consume();
        return undefined;
      }
      case "EOF":
        if (!prev) throw this.pushFatalError("Unexpected end of file", token);
        return undefined;
      default:
        token satisfies never;
    }
  }

  parseCounterAuto(): Child {
    // Already consumed a "⦃"
    const name = this.consumeType("Control");
    this.consumeType("EndAuto");
    return {
      ...name,
      needsBracesIfCount: true,
    };
  }

  parseDef(token: Control): Def {
    // Already consumed a "\def"
    const name = this.consumeType("Control");
    const params = this.parseUntil(["Begin", "End"]);
    this.consumeType("Begin");
    const body = this.parseUntil(["End"]);
    this.consumeType("End");
    return {
      type: "Def",
      callee: token,
      binding: name,
      params,
      body,
    };
  }

  parseLet(callee: Control): Let {
    // Already consumed a "\let"
    // TODO: Add macros like #1 to lexer.
    // TODO: allow those on rhs of Let.
    // For united-states
    const name = this.consumeType("Control");
    const rhs = this.consumeType("Control");
    return { type: "Let", callee, binding: name, rhs };
  }

  parseNewcount(callee: Control): Newcount {
    // Already consumed a "\newcount"
    const binding = this.consumeType("Control");
    return { type: "Newcount", callee, binding };
  }

  parseUsegolf(): Usegolf {
    // Already consumed a "\usegolf"
    this.consumeType("Begin");
    this.insideUsegolf = true;
    const children = this.parseGroup().children;
    this.insideUsegolf = false;
    return { type: "Usegolf", children };
  }
}
