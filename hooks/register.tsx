import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { sceneSvg } from './scene'

// Night-at-the-beach plum: tinted grays from the sky's hue, white text,
// neon pink as the accent. Dark only — the scene is a dusk scene.
const { theme, problems } = makeColors({
  label: 'Vice Sunset',
  only: 'dark',
  roles: {
    accent: '#ff3d9a',
    danger: '#ff5468',
    success: '#3ee0a1',
    warning: '#ffb547',
    pro: '#a77bff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#140826',
        'surface-1': '#1d0c33',
        'surface-2': '#24103e',
        'surface-3': '#2b1447',
        'text-primary': '#ffffff',
        'text-secondary': '#e6d9f2',
        'text-muted': '#bba6d1',
      },
    },
  },
})

const now = atom({ plugin: 'vice-sunset', key: 'now' } as const, 0)

type Options = {
  showCountdown?: boolean
  countdownLabel?: string
  countdownTarget?: string
  animate?: boolean
}

// Countdown colours from the reference: amber days, pink hours,
// violet minutes, green seconds.
const PINK = '#ff3d9a'
const UNIT_COLORS = ['#ffb547', '#ff5fae', '#a77bff', '#3ee0a1'] as const

function parts(ms: number): string[] {
  const s = Math.max(0, Math.floor(ms / 1000))

  return [`${Math.floor(s / 86400)}d`, `${Math.floor((s % 86400) / 3600)}h`, `${Math.floor((s % 3600) / 60)}m`, `${s % 60}s`]
}

export const register: Register = (on, options) => {
  const opts = options as Options
  const showCountdown = opts.showCountdown !== false
  const label = (opts.countdownLabel ?? 'GTA VI').trim() || 'GTA VI'
  const target = Date.parse(opts.countdownTarget ?? '2026-11-19T00:00:00Z')
  const scene = sceneSvg(opts.animate !== false)

  const LOOK: ThemeSetArgs = {
    colors: theme,
    overrideColorScheme: 'dark',
    backdrop: {
      scene: 'vice-sunset',
      // translucent plum panels over the scene
      glass: { blur: 18, tint: '#1e0b36', opacity: 0.62 },
    },
  }

  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    // A session can start before the app attaches, so isDrawn may be false
    // here even though the look draws once it does: no status note.
    await $.theme.set(LOOK)

    if (showCountdown && !Number.isNaN(target)) {
      const tick = async () => {
        const t = await $.clock.now()
        await update($, now, () => t)
      }
      await tick()
      $.clock.every(1000, tick)
    } else if (showCountdown) {
      $.ui.toast('Vice Sunset: countdown target is not a valid ISO date')
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    // Every mod's backdrop reaches this hook: draw only our own scene.
    if (e.props.plugin !== $.plugin.name || e.props.scene !== 'vice-sunset') {
      return next(e)
    }
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={scene} alt="Purple sunset sky with palm silhouettes and a distant city skyline" isInteractive />
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!showCountdown || Number.isNaN(target) || e.props.hasSurvey) {
      return next(e)
    }
    const t = await read($, now)

    if (t === 0) {
      return next(e)
    }
    const left = target - t
    const { Box, Text } = $.ui.resolve(e)

    if (left <= 0) {
      return (
        <Box>
          <Text color={PINK} weight="semibold">
            {label}
          </Text>
          <Text color="#e6d9f2"> is out now</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="row" gap={1}>
        <Text color={PINK} weight="semibold">
          {label}
        </Text>
        <Text color="#bba6d1">launches in</Text>
        {parts(left).map((p, i) => (
          <Text key={`u${i}`} color={UNIT_COLORS[i]} weight="semibold" tabular>
            {p}
          </Text>
        ))}
      </Box>
    )
  })
}
