# Contributing

Cheers for helping make KiraLume better. Open an issue for a bug or a palette idea, then send a pull request with a clear summary and screenshots for visual changes.

Use Node.js 26 LTS and run `npm ci`. Edit `src/palettes.mjs` for colours or `src/theme.mjs` for shared mappings. Run `npm run generate` and commit the resulting JSON. Finish with `npm run format:check`, `npm run check:generated`, `npm test`, `npm run package` and `npm run test:integration`. On headless Linux, use `xvfb-run -a npm run test:integration`.

Please check editor text, comments, selection, diagnostics, terminal colours and keyboard focus in VS Code. Keep contrast checks passing and include before and after screenshots when changing colours.
