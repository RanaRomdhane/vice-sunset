import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'vice-sunset',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

// 2d 12h 33m 44s before the target
const TARGET = Date.parse('2026-11-19T00:00:00Z')
const NOW = TARGET - ((2 * 86400 + 12 * 3600 + 33 * 60 + 44) * 1000)

test('the countdown row reads days, hours, minutes and seconds', async ($, on) => {
  on('state.get', () => ({ value: { value: NOW, version: 1 } }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /^GTA VI$/ }))?.text).toBe('GTA VI')
    expect((await ui.find({ type: 'Text', text: /^2d$/ }))?.text).toBe('2d')
    expect((await ui.find({ type: 'Text', text: /^12h$/ }))?.text).toBe('12h')
    expect((await ui.find({ type: 'Text', text: /^33m$/ }))?.text).toBe('33m')
    expect((await ui.find({ type: 'Text', text: /^44s$/ }))?.text).toBe('44s')
    await ui.unmount()
  }
})

test('a custom label and date are honoured', { options: { countdownLabel: 'Launch', countdownTarget: '2026-11-20T00:00:00Z' } }, async ($, on) => {
  on('state.get', () => ({ value: { value: NOW, version: 1 } }))

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^Launch$/ }))?.text).toBe('Launch')
  expect((await ui.find({ type: 'Text', text: /^3d$/ }))?.text).toBe('3d')
  await ui.unmount()
})

test('turning the countdown off leaves the band to the engine', { options: { showCountdown: false } }, async ($, on) => {
  on('state.get', () => ({ value: { value: NOW, version: 1 } }))

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /launches in/ })).toBeUndefined()
  await ui.unmount()
})
