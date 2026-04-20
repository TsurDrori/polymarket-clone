export const shouldBypassNextImageOptimization = (src: string): boolean =>
  /^https?:\/\//.test(src);
