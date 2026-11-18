// Secondary pages are code-split: the list (landing page) ships in the main chunk.
export const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});
