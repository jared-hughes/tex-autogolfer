# TeX AutoGolfer

(Heavily Work-in-Progress)

Highly-golfed TeX programs are hard to maintain. This tool strives to:

- shrink identifiers to shorter identifiers, in some situations:
  - renaming stuff defined by `\def`
  - Using `\let` to re-define builtin names
  - Using `\catcode` to make some bytes active
- remove whitespace and comments

This tool makes no guarantee about preserving program correctness. However, there are some ways you can help the tool ensure it doesn't change program behavior:

- ensure each identifier is only for one purpose (i.e. isn't re-defined)
- mark required spaces (for typography) as `␣`
- mark required spaces (for preventing e.g. a number from running on too long) as `⫽`
- don't use `\let` to rename stuff at the top
  - this tool assumes that all `\let`s must be preserved
- to avoid collisions, don't use any active characters (`~` or U+000C (form feed))
- don't mess with `\catcode`s
- don't use multibyte UTF-8 characters in places that would confuse the tool

## Dev

Run `npm install` to install.

Command recipes:

```sh
npm run build --watch
npm run lint --watch
# CLI, only after a build
node ./dist/cli.js -i scratch/a.tex -o scratch/b.tex
```
