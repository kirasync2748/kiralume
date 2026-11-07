import { readFile, writeFile, mkdir } from "node:fs/promises";
import { palettes } from "../src/palettes.mjs";
import { createTheme } from "../src/theme.mjs";

const check = process.argv.includes("--check");
await mkdir(new URL("../themes/", import.meta.url), { recursive: true });
let stale = false;
for (const palette of palettes) {
  const path = new URL(
    `../themes/${palette.id}-color-theme.json`,
    import.meta.url,
  );
  const expected = `${JSON.stringify(createTheme(palette), null, 2)}\n`;
  if (check) {
    const current = await readFile(path, "utf8").catch(() => "");
    if (current !== expected) {
      console.error(`Theme needs a refresh: ${palette.id}`);
      stale = true;
    }
  } else {
    await writeFile(path, expected);
  }
}
if (stale) process.exitCode = 1;
