/** Chrome exposes `chrome`, Firefox exposes both `browser` and `chrome`. Use whichever namespace exists. */
export const ext: typeof chrome =
  (globalThis as unknown as { browser?: typeof chrome }).browser ?? chrome
