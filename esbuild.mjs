import esbuild from "esbuild";
import { promises as fs } from "fs";

const outdir = "dist";

const args = process.argv.slice(2);
const watch = args.includes("--watch") || args.includes("-w");

const opts = {
  entryPoints: ["cli.ts"],
  sourcemap: true,
  bundle: true,
  platform: "node",
  outdir,
  plugins: [],
  loader: { ".ts": "ts" },
  logLevel: "info",
};

// clean dist folder
try {
  await fs.rm(outdir, { recursive: true });
} catch (e) {
  // permit no dist folder to begin with
  if (e?.code !== "ENOENT") throw e;
}

if (watch) {
  const ctx = await esbuild.context(opts);
  await ctx.rebuild();
  await ctx.watch();
} else {
  void esbuild.build(opts);
}
