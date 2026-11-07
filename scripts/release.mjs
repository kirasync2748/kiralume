import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const runGh = (args) =>
  execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

export function publishRelease(tag, repository, run = runGh) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag || ""))
    throw new Error("A stable release tag is required");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || ""))
    throw new Error("GH_REPO must identify the release repository");

  // Listing errors must stop publishing, rather than look like a missing release.
  const existing = run([
    "api",
    "--paginate",
    `repos/${repository}/releases`,
    "--jq",
    `.[] | select(.tag_name == "${tag}") | .id`,
  ]).trim();
  if (!existing)
    run([
      "release",
      "create",
      tag,
      "--repo",
      repository,
      "--verify-tag",
      "--generate-notes",
      "--title",
      `KiraLume ${tag}`,
    ]);

  const readAssets = () =>
    JSON.parse(run(["api", `repos/${repository}/releases/tags/${tag}`])).assets;
  const assetsBefore = readAssets();
  // GitHub treats asset names case-insensitively. Move the old spelling aside
  // until the new upload is verified, so a failed upload still has a download.
  const oldLocal = assetsBefore.find((asset) => asset.name === "kiralume.vsix");
  if (oldLocal) {
    const temporaryName = `kiralume-legacy-${oldLocal.id}.vsix`;
    if (assetsBefore.some((asset) => asset.name === temporaryName))
      throw new Error(`Cannot reserve legacy asset name ${temporaryName}`);
    run([
      "api",
      `repos/${repository}/releases/assets/${oldLocal.id}`,
      "--method",
      "PATCH",
      "-f",
      `name=${temporaryName}`,
    ]);
  }

  run([
    "release",
    "upload",
    tag,
    "dist/KiraLume.vsix",
    "dist/SHA256SUMS.txt",
    "--repo",
    repository,
    "--clobber",
  ]);

  // Clean up assets from the old two-package release, keeping unrelated uploads.
  const assets = readAssets();
  for (const name of ["KiraLume.vsix", "SHA256SUMS.txt"])
    if (!assets.some((asset) => asset.name === name))
      throw new Error(`${name} is missing from the release`);
  for (const asset of assets) {
    const isLegacy =
      asset.name === "kiralume-marketplace.vsix" ||
      asset.name === `kiralume-legacy-${asset.id}.vsix`;
    if (isLegacy)
      run([
        "release",
        "delete-asset",
        tag,
        asset.name,
        "--repo",
        repository,
        "--yes",
      ]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  publishRelease(process.env.GITHUB_REF_NAME, process.env.GH_REPO);
