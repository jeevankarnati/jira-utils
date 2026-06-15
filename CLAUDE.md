# Project Notes

## React Compiler is enabled

`babel-plugin-react-compiler` is active (configured via `reactCompilerPreset()` in `vite.config.ts`).

**What this means for code reviews and audits:**

- Do **not** flag missing `useCallback`, `useMemo`, or `React.memo` — the compiler inserts these automatically.
- Callback references passed as props are automatically stabilised (no need for `useCallback`).
- Derived values inside components are automatically memoised (no need for `useMemo`).
- Components are automatically memoised equivalent to `React.memo`.

Manual memoisation should only be added in the rare cases where the compiler emits a bailout warning in the build output.

## Quality checks

After completing any task, always run:

```bash
bun run quality
```

This runs lint and format checks. Fix any issues before considering the task done.
