# TeX AutoGolfer

(Heavily Work-in-Progress)

Highly-golfed TeX programs are hard to maintain. This tool strives to:

- shrink identifiers to shorter identifiers, in some situations:
  - ✓ renaming stuff defined by `\def` or `\let`
  - ✓ Using `\let` to re-define builtin names
  - Using `\catcode` to make some bytes active
- ✓ handle transformation of e.g. `\newcount\x`, `\x` to `\count1`
- ✓ remove whitespace and comments

Use `\rebind\def` if you want to rename all the `\def` to a shorter identifier.

## Example

Input (71 bytes):

```tex
\def\double#1{#1#1}
\def\triple#1{#1#1#1}
\double a
\triple c
\double b
```

Output (36 bytes):

```tex
\def~#1{#1#1}\def\!#1{#1#1#1}~a\!c~b
```

## Disclaimer

This tool makes no guarantee about preserving program correctness. However, there are some ways you can help the tool ensure it doesn't change program behavior:

- mark required spaces (for typography) as `␣`. These convert to ` ` or `\ ` (if the ` ` would be gobbled)
- mark required spaces (for preventing e.g. a number from running on too long) as `⫽⫽`. These convert to ` `
- if the space is only required if the control sequence before it gets converted to end in a number like `\count1`, then write `⫽`
  - these are automatically inserted before any digit preceded by a control sequence
  - e.g. a macro to mod counter `\d` by a number literal can be written `\def\m#1;{\u\d\divide\u⫽#1\multiply\u⫽#1\advance\d-\u}` and used `\m17;`
- don't mess with `\catcode`s
- don't use multi-byte UTF-8 characters in places that would confuse the tool
  - TeX doesn't understand multi-byte characters (your code gets broken into bytes), but I decided to preserve them.
- (I don't think this matters yet) ensure each identifier is only for one purpose (i.e. isn't re-defined)
- instead of writing `\argv\x`, write `\argv⦃\x⦄` so it can be transformed to `\argv{\count1}` safely if `\count` transform happens, or `\argv\x` otherwise.

## XCompose

Sample `.XCompose` for the funny unicode.

```
<Multi_key> <space> <space>		: "␣"
<Multi_key> <slash> <slash>		: "⫽"
<Multi_key> <braceleft> <braceleft>	: "⦃"
<Multi_key> <braceright> <braceright>	: "⦄"
```

## Dev

Run `npm install` to install.

Command recipes:

```sh
npm run build --watch
npm run lint --watch
# CLI, only after a build
node ./dist/cli.js scratch/a.tex > scratch/b.tex
```
