const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const vscode = require("vscode");

exports.run = async () => {
  const extension = vscode.extensions.getExtension("kirasync2748.kiralume");
  assert.ok(extension, "KiraLume must be discoverable by VS Code");
  const manifest = extension.packageJSON;
  const icon = await readFile(
    path.join(extension.extensionPath, manifest.icon),
  );
  assert.equal(icon.subarray(1, 4).toString(), "PNG");
  assert.equal(icon.readUInt32BE(16), 256);
  assert.equal(icon.readUInt32BE(20), 256);
  assert.equal(
    manifest.main,
    undefined,
    "Themes must not start an extension process",
  );
  const themes = manifest.contributes.themes;
  assert.equal(themes.length, 3);
  const expected = {
    "vs-dark": vscode.ColorThemeKind.Dark,
    vs: vscode.ColorThemeKind.Light,
    "hc-black": vscode.ColorThemeKind.HighContrast,
    "hc-light": vscode.ColorThemeKind.HighContrastLight,
  };
  const samples = require("./languages.json");
  for (const theme of themes) {
    const data = JSON.parse(
      await readFile(path.join(extension.extensionPath, theme.path), "utf8"),
    );
    assert.equal(data.name, theme.label);
    // Listen before changing settings so same-kind theme changes are checked too.
    let subscription;
    let timer;
    const changed = new Promise((resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${theme.label} did not finish loading`)),
        10000,
      );
      subscription = vscode.window.onDidChangeActiveColorTheme(resolve);
    });
    try {
      await Promise.all([
        changed,
        vscode.workspace
          .getConfiguration("workbench")
          .update("colorTheme", theme.label, vscode.ConfigurationTarget.Global),
      ]);
      assert.equal(
        vscode.workspace.getConfiguration("workbench").get("colorTheme"),
        theme.label,
      );
      assert.equal(
        vscode.window.activeColorTheme.kind,
        expected[theme.uiTheme],
        `${theme.label} must load as ${theme.uiTheme}`,
      );
      for (const [language, content] of Object.entries(samples)) {
        const document = await vscode.workspace.openTextDocument({
          language,
          content,
        });
        assert.equal(document.languageId, language);
        await vscode.window.showTextDocument(document, { preview: true });
        assert.equal(
          vscode.window.activeTextEditor.document.getText(),
          content,
        );
      }
      console.log(
        `Loaded ${theme.label}; opened ${Object.keys(samples).length} language fixtures`,
      );
    } finally {
      clearTimeout(timer);
      subscription.dispose();
    }
  }
};
