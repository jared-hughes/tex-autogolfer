# TeX AutoGolfer

(Heavily Work-in-Progress)

Highly-golfed TeX programs are hard to maintain. This tool strives to:

- shrink identifiers to shorter identifiers, in some situations:
  - ✓ renaming stuff defined by `\def` or `\let`
  - ✓ Using `\let` to re-define builtin names
  - Using `\catcode` to make some bytes active
- ✓ handle transformation of e.g. `\newcount\x`, `\x` to `\count1`
- ✓ remove whitespace and comments

## Example

Input (71 bytes):

```tex
\usegolf{rename}
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

## Configuration

Most golfing configuration is on the input files of the form of LaTeX-looking `\usegolf` commands. While `\usegolf` can be specified in any order, golfing transforms are always executed in the same order.

1. `\usegolf{count}`: convert `\newcount` usages to `\count`.

   - Write `⫽` after any counter control sequence that needs a space after it if converted to a `\count`
     - `⫽` is automatically inserted before any digit preceded by a control sequence
     - e.g. a macro to mod counter `\d` by a number literal can be written `\def\m#1;{\u\d\divide\u⫽#1\multiply\u⫽#1\advance\d-\u}` and used `\m17;`
   - Write `⦃ ⦄` around and counter control sequence that needs curly braces around it if convered to a `\count`
     - e.g. write `\argv⦃\x⦄` so it can be transformed to `\argv{\count1}` instead of `\argv\count1`.
     - If there is no `\usegolf{count}`, then the curly braces are removed.

1. `\usegolf{rebind<control-seq>}`: really just a convenience

   - For example, `\usegolf{rebind\def}` replaces every `\def` with a `\defRebind` and puts a `\let\defRebind\def` to the program. This lets `\usegolf{rename}` below rename `\def`
   - `\usegolf{count}` automatically adds a `\usegolf{rebind\count}` at the top of the file
   - The `\let` is placed at the position of the `\usegolf`, so writing `\usegolf{rebind\newcount~}\newcount\x\usegolf{rebind\advance~}\advance\x1` will work.

1. `\usegolf{rename}`: rename identifiers bound with `\let`, `\def`, and `\newcount`

   - The identifiers are renamed by default to identifiers like `\$`. These have the slight advantages (over `\a`) of less often needing spaces after them
   - The most-common identifier is renamed to `~`, which is the only default active character that works everywhere. Make sure not to use `~` for a space: use `␣` instead.
   - (Not yet implemented) some way to allow form-feed and other single-byte active characters

1. `\usegolf{rename<control-seq-1><control-seq-2>}`: specify a particular rename to use

   - E.g. `\usegolf{rename\def\D}` renames `\def` to `\D` instead of whatever arbitrarily chosen identifier like `\$`.
   - Has no effect if `\usegolf{rename}` is not provided
     - (for forwards compatibility with a future decision of either enabling renaming everything, or just renaming that one thing)
   - Note that formfeed `` (0x0C) is an active character, but only works in some contexts, so it's not automatically chosen. You can use it like `\usegolf{rename\def}`
   - Write `\usegolf{rename-add\name}` if you want to prioritize consideration of that control sequence. For example, if you change `$` to be an active character (``\catcode`$=13``), then write `\usegolf{rename-add$}`
   - If you change `%` to be an active character, then write `\usegolf{rename-add\char37}` (since `%` is byte 37). Same applies to any other single byte, but if it's not a special character, you can also write the name directly.

1. If an operation such as `\rebind` would rename too much stuff, name the control sequences you don't want renamed with `↦`. E.g. `\def↦\def\f{hi}` (instead of `\def\f{hi}`) if you rebind `\def` later on.

1. Not a golf option, but just an ease of input: write `⦃97⦄` to get an `a`, for example. Specify the codepoint in decimal (or in hex, with a 0x prefix, e.g. `⦃0x61⦄`). This is in the pre-processer, before any golfs happen. In particular, `⦃12⦄` gives form feed.

There's one more option. If you write `--preserve-newlines` on the command line, then the parser will not delete newlines.

## Disclaimer

This tool makes no guarantee about preserving program correctness. However, there are some ways you can help the tool ensure it doesn't change program behavior:

- Mark required spaces (for typography) as `␣`. These convert to ` ` (or `\ ` if the ` ` would be gobbled)
- Mark required spaces (for preventing e.g. a number from running on too long) as `⫽⫽`. These convert to ` ` (or `{}` if the ` ` would be gobbled)
- Mark required spaces (for `\catcode32=12`) as `…`. These convert to ` ` unconditionally
- Messing with `\catcode`s is risky.
- Don't use multi-byte UTF-8 characters in places that would confuse the tool
  - TeX doesn't understand multi-byte characters (your code gets broken into bytes), but I decided to preserve them.
- Ensure each identifier is only for one purpose (i.e. isn't re-defined)
- More suggestions, such as `\x⫽` and `⦃\x⦄` are listed above in the "Configuration" section.

## XCompose

A sample `.XCompose` for the funny unicode.

```
<Multi_key> <space> <space>		: "␣"
<Multi_key> <slash> <slash>		: "⫽"
<Multi_key> <braceleft> <braceleft>	: "⦃"
<Multi_key> <braceright> <braceright>	: "⦄"
<Multi_key> <t> <o>                     : "↦"
```

## Dev

Run `npm install` to install.

Command recipes:

```sh
npm run build --watch
npm run lint --watch
# CLI, only after a build
node ./dist/cli.js scratch/a.tex > scratch/b.tex
# View form-feeds in output, and add trailing newline
node ./dist/cli.js examples/ex6.tex | sed -e 's/\f/�/g'; echo
```
