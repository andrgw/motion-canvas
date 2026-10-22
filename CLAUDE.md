# Motion Canvas

Motion Canvas is a TypeScript library for animations written as code (a scene is
a generator function), plus a browser editor that previews and renders them.
It's a monorepo managed with npm workspaces and lerna. Run commands from the
repo root.

## Architecture

- `packages/core`: the runtime. Threads (`src/threading`), signals, tweening,
  flow helpers (`src/flow`), and project setup and playback (`src/app`, with
  `makeProject`, `Player` and `Renderer`).
- `packages/2d`: Node classes (`src/lib/components`), the JSX runtime, and the
  signal decorators (`src/lib/decorators`). `src/editor` is the 2d plugin for
  the editor, and rollup builds it into `packages/2d/editor`.
- `packages/ui`: the editor app, in Preact and `@preact/signals` (not React).
- `packages/vite-plugin`: serves the editor and handles `?scene` imports and
  `.meta` files.
- `packages/examples`: scenes shown in the docs. `packages/template`: dev
  sandbox. `packages/e2e`: render snapshot test.
- Packages use each other's build output (`lib/`, `dist/`,
  `packages/2d/editor`), not `src/`. Two exceptions: `packages/template` aliases
  core, 2d, ui and vite-plugin to source, and the docs build their API pages
  from TSDoc in `core/src` and `2d/src/lib`.

## Commands

```bash
npx lerna run build                 # build the libraries in order (~15s), do this first
npx lerna run test -- --run         # core + 2d unit tests, runs once
npm test -w packages/2d -- --run src/lib/components/Txt.test.tsx   # one file
npm test -w packages/e2e -- --run   # render test (first time: npx playwright install firefox)
npm run eslint && npm run prettier  # CI lint checks
npm run examples:build              # type-check and build the examples, as CI does
npm run examples:dev                # editor at http://localhost:9000/src/<name>
npm run template:dev                # editor UI work, http://localhost:9000/ (not ui:dev)
```

## Conventions

- Core tests sit next to the source (`createSignal.test.ts`). 2d tests that
  create nodes call `mockScene2D()` inside `describe()` and wrap timed tests in
  `generatorTest(function* () {...})`. Both helpers are in
  `packages/2d/src/lib/components/__tests__/`.
- ESLint: every class member needs `public`, `protected` or `private`, type
  parameters start with `T` (`TValue`), and non-exported module-level variables
  (arrow functions too) are PascalCase or UPPER_CASE (`const Radius = 60;`).
- A 2d prop is
  `@signal() public declare readonly startAngle: SimpleSignal<number, this>;` on
  the class plus `startAngle?: SignalValue<number>;` in its props interface
  (`CircleProps`). `@initial()` and `@parser()` go above `@signal()`. Below it
  they log "Missing property decorator" and do nothing.
- In scenes, use `useRandom()`, not `Math.random()`. Seeking replays the scene
  from the start.
- A new example needs `packages/examples/src/<name>.ts` (`makeProject`,
  importing `./scenes/<name>?scene`), `src/scenes/<name>.tsx`, and an entry in
  the explicit `project` list in `packages/examples/vite.config.ts`. The first
  `examples:dev` or `examples:build` creates `src/<name>.meta` and
  `src/scenes/<name>.meta`. Commit both.
- Leave commit messages to the user (CONTRIBUTING.md discourages AI-written
  ones). A commit scope, if used, must be listed in `commitlint.config.js`,
  which leaves out `template` and `internal`.

## Gotchas

- Don't run `npm run core:test` or `npm run 2d:test`. Vitest starts in watch
  mode even with `-- --run`, because the inner npm call takes `--run` as its own
  option.
- `Failed to resolve entry for package "@motion-canvas/core"` in 2d tests means
  core isn't built. 2d tests don't see edits to `packages/core/src` until you
  run `npm run core:build`.
- 2d tests run in jsdom, which has no `DOMMatrix` and no layout, so transforms
  like `localToParent()` fail there. Leave rendering checks to e2e.
- Build core and 2d with their npm scripts, which use `tspc`. Plain `tsc` skips
  the transform that inlines `__logs__/*.md` imports as strings.
- `npx lerna run ...` skips the private packages (examples, docs, e2e,
  template). Use their own npm scripts.
- The editor rewrites a project's `.meta` file when it opens the project. Revert
  `.meta` changes you didn't mean to make.
- Docs need `npx lerna run bundle` first. To see TSDoc edits in `docs:dev`,
  delete its cache at `packages/docs/src/generated`.
- Don't edit `CHANGELOG.md`, package versions (lerna sets them on release), or
  build output: `lib/`, `dist/`, `packages/2d/editor`,
  `packages/docs/static/{examples,editor,modules}`,
  `packages/docs/src/generated`.
- Formatting only happens in the pre-commit hook, and CI checks every file. Run
  `npx prettier --write <files>` on what you add or change.
