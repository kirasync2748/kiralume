import {
  downloadAndUnzipVSCode,
  runTests,
  runVSCodeCommand,
} from "@vscode/test-electron";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "kiralume-vscode-"));
const userData = join(temp, "user");
const extensions = join(temp, "extensions");
const version = process.env.VSCODE_VERSION || "stable";
try {
  const vscodeExecutablePath = await downloadAndUnzipVSCode(version);
  const installArgs = [
    "--no-sandbox",
    `--user-data-dir=${userData}`,
    `--extensions-dir=${extensions}`,
    "--install-extension",
    join(root, process.env.VSIX_PATH || "dist/KiraLume.vsix"),
  ];
  // The Windows CLI is a .cmd file, so its shell needs quoted arguments for paths with spaces.
  if (process.platform === "win32") {
    for (let i = 0; i < installArgs.length; i++) {
      if (/["%!]/.test(installArgs[i]))
        throw new Error("Unsupported character in VS Code test path");
      installArgs[i] = `"${installArgs[i]}"`;
    }
  }
  await runVSCodeCommand(installArgs, { version, reuseMachineInstall: true });
  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath: join(root, "test/fixture"),
    extensionTestsPath: fileURLToPath(
      new URL("./vscode-suite.cjs", import.meta.url),
    ),
    launchArgs: [
      "--disable-workspace-trust",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      `--user-data-dir=${userData}`,
      `--extensions-dir=${extensions}`,
    ],
  });
} finally {
  // Windows can keep telemetry logs locked briefly after the test host exits.
  await rm(temp, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 300,
  });
}
