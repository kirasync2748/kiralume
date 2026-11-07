import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, root), "utf8"));
const manifest = await readJson("package.json");
const themes = await Promise.all(
  manifest.contributes.themes.map(async (item) => ({
    ...item,
    theme: await readJson(item.path),
  })),
);

function luminance(hex) {
  const components = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  return components
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test("only Midnight, Dawn and Daylight are shipped", async () => {
  assert.deepEqual(themes.map((t) => t.label).sort(), [
    "KiraLume Dawn",
    "KiraLume Daylight",
    "KiraLume Midnight",
  ]);
  const files = await readdir(new URL("themes/", root));
  assert.deepEqual(
    files.sort(),
    manifest.contributes.themes.map((t) => t.path.split("/").pop()).sort(),
  );
  assert.equal(themes.filter((t) => t.uiTheme === "vs-dark").length, 1);
  assert.equal(themes.filter((t) => t.uiTheme === "vs").length, 2);
});

for (const { label, uiTheme, theme } of themes) {
  test(`${label}: colours and syntax are readable and well formed`, () => {
    assert.equal(theme.name, label);
    assert.equal(
      theme.type,
      ["vs", "hc-light"].includes(uiTheme) ? "light" : "dark",
    );
    assert.equal(theme.semanticHighlighting, true);
    for (const [key, value] of Object.entries(theme.colors))
      assert.match(value, /^#[0-9a-f]{6}([0-9a-f]{2})?$/i, `${key}: ${value}`);
    const c = theme.colors;
    for (const [fg, bg] of [
      ["editor.foreground", "editor.background"],
      ["editorLineNumber.foreground", "editor.background"],
      ["sideBar.foreground", "sideBar.background"],
      ["statusBar.foreground", "statusBar.background"],
      ["terminal.foreground", "terminal.background"],
      ["input.foreground", "input.background"],
    ]) {
      assert.ok(
        contrast(c[fg], c[bg]) >= 4.5,
        `${fg} on ${bg}: ${contrast(c[fg], c[bg]).toFixed(2)} < 4.5`,
      );
    }
    for (const rule of theme.tokenColors)
      if (rule.settings.foreground)
        assert.ok(
          contrast(rule.settings.foreground, c["editor.background"]) >= 4.5,
          `${rule.name}: ${contrast(rule.settings.foreground, c["editor.background"]).toFixed(2)} < 4.5`,
        );
    for (const key of [
      "terminal.ansiBlack",
      "terminal.ansiRed",
      "terminal.ansiGreen",
      "terminal.ansiYellow",
      "terminal.ansiBlue",
      "terminal.ansiMagenta",
      "terminal.ansiCyan",
      "terminal.ansiWhite",
      "editorError.foreground",
      "editorWarning.foreground",
      "focusBorder",
    ])
      assert.ok(c[key], `Missing ${key}`);
    assert.ok(Object.keys(theme.semanticTokenColors).length >= 15);
  });
}

for (const { label, theme } of themes) {
  test(`${label}: workbench surfaces and language families have explicit coverage`, () => {
    for (const key of [
      "testing.iconPassed",
      "debugExceptionWidget.background",
      "merge.currentContentBackground",
      "settings.textInputForeground",
      "minimap.selectionHighlight",
      "activityBarTop.foreground",
      "inlineChat.background",
      "notebook.outputContainerBorderColor",
      "symbolIcon.methodForeground",
      "statusBarItem.errorForeground",
      "editorGhostText.foreground",
      "terminalStickyScroll.background",
    ])
      assert.ok(theme.colors[key], key);
    for (const type of [
      "namespace",
      "type",
      "class",
      "enum",
      "interface",
      "struct",
      "typeParameter",
      "parameter",
      "variable",
      "property",
      "enumMember",
      "event",
      "function",
      "method",
      "macro",
      "keyword",
      "modifier",
      "comment",
      "string",
      "number",
      "regexp",
      "operator",
      "decorator",
      "label",
    ])
      assert.ok(theme.semanticTokenColors[type], type);
    const scopes = theme.tokenColors.flatMap((r) => r.scope);
    for (const scope of [
      "source",
      "text",
      "meta.preprocessor",
      "entity.name.namespace",
      "meta.annotation",
      "support.type.property-name.json",
      "entity.name.tag.yaml",
      "markup.inserted",
      "markup.deleted",
      "punctuation.section.embedded",
    ])
      assert.ok(scopes.includes(scope), scope);
    for (const value of Object.values(theme.semanticTokenColors)) {
      const colour = typeof value === "string" ? value : value.foreground;
      if (colour)
        assert.ok(contrast(colour, theme.colors["editor.background"]) >= 4.5);
    }
  });
}
