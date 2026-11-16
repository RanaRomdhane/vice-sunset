export type ViceSunsetNow = number

declare module 'claude-code' {
  interface PluginState {
    'vice-sunset': { now: ViceSunsetNow }
  }
}
