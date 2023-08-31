class Watch {
  public on: (event: string, cb: Function) => void
  public close: () => void
}

module 'tsconfig.js' {
  export const once: (options: Record<string, unknown>) => Promise<void>,
    watch: (options: Record<string, unknown>) => Watch
}
