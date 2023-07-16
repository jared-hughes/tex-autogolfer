# TeX AutoGolfer

(Heavily Work-in-Progress)

Highly-golfed TeX programs are hard to maintain. This tool strives to:

- shrink identifiers to shorter identifiers, in some situations:
  - ✓ renaming stuff defined by `\def`
  - Using `\let` to re-define builtin names
  - Using `\catcode` to make some bytes active
- ✓ remove whitespace and comments

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

- mark required spaces (for typography) as `␣`
- mark required spaces (for preventing e.g. a number from running on too long) as `⫽`
- don't mess with `\catcode`s
- don't use multi-byte UTF-8 characters in places that would confuse the tool
  - TeX doesn't understand multi-byte characters (your code gets broken into bytes), but I decided to preserve them.
- (I don't think this matters yet) ensure each identifier is only for one purpose (i.e. isn't re-defined)

## Dev

Run `npm install` to install.

Command recipes:

```sh
npm run build --watch
npm run lint --watch
# CLI, only after a build
node ./dist/cli.js scratch/a.tex > scratch/b.tex
```
