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
- mark required spaces as `␣`

## Dev

Run `npm install` to install.

Command recipes:

```sh
npm run build --watch
npm run lint --watch
# CLI, only after a build
node ./dist/cli.js -i scratch/a.tex -o scratch/b.tex
```
