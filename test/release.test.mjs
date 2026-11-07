import assert from "node:assert/strict";
import test from "node:test";
import { publishRelease } from "../scripts/release.mjs";

// Model GitHub's case-insensitive asset names and interrupted uploads.
function github({ existing = true, assets = [], fail } = {}) {
  const calls = [];
  let releaseExists = existing;
  const state = assets.map((name, i) => ({ id: i + 1, name }));
  const run = (args) => {
    calls.push(args);
    const [command, subcommand] = args;
    const action =
      command === "api"
        ? args.includes("PATCH")
          ? "rename"
          : args.includes("--paginate")
            ? "list"
            : "assets"
        : subcommand;
    if (fail === action) throw new Error(`${action} failed`);
    if (action === "list") return releaseExists ? "123" : "";
    if (action === "create") {
      releaseExists = true;
      return "";
    }
    if (action === "assets") return JSON.stringify({ assets: state });
    if (action === "rename") {
      const id = Number(subcommand.split("/").at(-1));
      state.find((asset) => asset.id === id).name = args.at(-1).slice(5);
      return "";
    }
    if (action === "upload") {
      assert.equal(args[3], "dist/KiraLume.vsix");
      assert.equal(args[4], "dist/SHA256SUMS.txt");
      assert.ok(args.includes("--clobber"));
      const collision = state.find(
        (asset) => asset.name.toLowerCase() === "kiralume.vsix",
      );
      if (collision && collision.name !== "KiraLume.vsix")
        throw new Error("case collision");
      if (!collision) state.push({ id: 100, name: "KiraLume.vsix" });
      const checksum = state.find((asset) => asset.name === "SHA256SUMS.txt");
      if (checksum) checksum.refreshed = true;
      else state.push({ id: 101, name: "SHA256SUMS.txt" });
      return "";
    }
    if (action === "delete-asset") {
      state.splice(
        state.findIndex((asset) => asset.name === args[3]),
        1,
      );
      return "";
    }
    throw new Error(`Unexpected call: ${args}`);
  };
  return { run, calls, state, setFailure: (value) => (fail = value) };
}

for (const existing of [true, false]) {
  test(`publishes one VSIX for ${existing ? "an existing" : "a new"} release`, () => {
    const client = github({ existing });
    publishRelease("v1.0.0", "owner/themes", client.run);
    assert.deepEqual(
      client.state.map((a) => a.name),
      ["KiraLume.vsix", "SHA256SUMS.txt"],
    );
    assert.equal(
      client.calls.some((a) => a[1] === "create"),
      !existing,
    );
  });
}

test("renames the conflicting old asset and removes only legacy assets after upload", () => {
  const client = github({
    assets: [
      "kiralume.vsix",
      "kiralume-marketplace.vsix",
      "SHA256SUMS.txt",
      "notes.pdf",
    ],
  });
  publishRelease("v1.0.0", "owner/themes", client.run);
  assert.deepEqual(client.state.map((a) => a.name).sort(), [
    "KiraLume.vsix",
    "SHA256SUMS.txt",
    "notes.pdf",
  ]);
  assert.equal(
    client.state.find((asset) => asset.name === "SHA256SUMS.txt").refreshed,
    true,
  );
  assert.ok(
    client.calls.findIndex((a) => a.includes("PATCH")) <
      client.calls.findIndex((a) => a[1] === "upload"),
  );
  assert.ok(
    client.calls.findIndex((a) => a[1] === "upload") <
      client.calls.findIndex((a) => a[1] === "delete-asset"),
  );
});

test("an interrupted upload retains old downloads and can be retried", () => {
  const client = github({
    assets: ["kiralume.vsix", "kiralume-marketplace.vsix"],
    fail: "upload",
  });
  assert.throws(
    () => publishRelease("v1.0.0", "owner/themes", client.run),
    /upload failed/,
  );
  assert.deepEqual(
    client.state.map((a) => a.name),
    ["kiralume-legacy-1.vsix", "kiralume-marketplace.vsix"],
  );
  client.setFailure(undefined);
  publishRelease("v1.0.0", "owner/themes", client.run);
  assert.deepEqual(
    client.state.map((a) => a.name),
    ["KiraLume.vsix", "SHA256SUMS.txt"],
  );
});

for (const step of ["list", "assets", "rename", "upload", "delete-asset"]) {
  test(`release publishing reports ${step} errors`, () => {
    const client = github({
      assets: ["kiralume.vsix", "kiralume-marketplace.vsix"],
      fail: step,
    });
    assert.throws(
      () => publishRelease("v1.0.0", "owner/themes", client.run),
      new RegExp(`${step} failed`),
    );
  });
}

test("missing uploaded asset never deletes existing downloads", () => {
  const client = github({ assets: ["kiralume-marketplace.vsix"] });
  const run = (args) => (args[1] === "upload" ? "" : client.run(args));
  assert.throws(
    () => publishRelease("v1.0.0", "owner/themes", run),
    /KiraLume.vsix is missing/,
  );
  assert.deepEqual(
    client.state.map((a) => a.name),
    ["kiralume-marketplace.vsix"],
  );
});

test("invalid release inputs cannot invoke GitHub", () => {
  for (const [tag, repo, message] of [
    ["v1.0.0-beta", "owner/themes", /stable release tag/],
    ["v1.0.0", "", /GH_REPO/],
  ])
    assert.throws(
      () =>
        publishRelease(tag, repo, () => assert.fail("Unexpected GitHub call")),
      message,
    );
});

test("a missing checksum prevents legacy asset cleanup", () => {
  const client = github({ assets: ["kiralume-marketplace.vsix"] });
  const run = (args) => {
    const result = client.run(args);
    if (args[1] === "upload")
      client.state.splice(
        client.state.findIndex((a) => a.name === "SHA256SUMS.txt"),
        1,
      );
    return result;
  };
  assert.throws(
    () => publishRelease("v1.0.0", "owner/themes", run),
    /SHA256SUMS.txt is missing/,
  );
  assert.ok(client.state.some((a) => a.name === "kiralume-marketplace.vsix"));
});
