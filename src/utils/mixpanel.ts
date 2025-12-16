/**
 * Mixpanel - small wrapper for mixpanel-browser
 *
 * Placed in `src/utils/` to keep analytics logic pure and reusable.
 */
import mixpanel from 'mixpanel-browser'
import type { ArtefactId } from '../types/artefacts'
import type { Rune, RuneType } from '../types/game'

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN
let initialized = false

/**
 * Initialize Mixpanel. Safe to call multiple times.
 * Reads token from `token` param or `import.meta.env.VITE_MIXPANEL_TOKEN`.
 */
export function initMixpanel() {
  if (typeof window === 'undefined') return
  if (initialized) return
  if (MIXPANEL_TOKEN === 'skip') return
  const finalToken = '150a8a103393d526b846dd7d68ce65fb';
  if (!finalToken) {
    console.warn('Mixpanel token not provided. Skipping Mixpanel initialization.')
  }

  try {
    mixpanel.init(finalToken, {
      autocapture: true,
      record_sessions_percent: 100,
      api_host: 'https://api-eu.mixpanel.com',
    })
    initialized = true
  } catch (e) {
    // Keep app robust if Mixpanel fails
    console.warn('Mixpanel init failed', e)
  }
}

/**
 * Track an event with optional properties.
 */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!initialized) return
  try {
    mixpanel.track(name, props)
  } catch (e) {
    console.warn('Mixpanel track failed', e)
  }
}

const emptyRuneTypeCounts = (): Record<RuneType, number> => ({
  Fire: 0,
  Frost: 0,
  Life: 0,
  Lightning: 0,
  Void: 0,
  Wind: 0,
})

function summarizeDeck(runes: Rune[]) {
  const counts = runes.reduce<Record<RuneType, number>>((acc, rune) => {
    acc[rune.runeType] += 1
    return acc
  }, emptyRuneTypeCounts())

  return {
    totalRunes: runes.length,
    counts,
  }
}

export function trackNewGameEvent(params: {
  gameNumber: number
  activeArtefacts: ArtefactId[]
  deck: Rune[]
  targetScore: number
  strain: number
  startingHealth: number
}) {
  trackEvent('New Game', {
    game: params.gameNumber,
    artefacts: params.activeArtefacts,
    targetScore: params.targetScore,
    strain: params.strain,
    startingHealth: params.startingHealth,
    deck: summarizeDeck(params.deck),
  })
}

export function trackDefeatEvent(params: {
  gameNumber: number
  deck: Rune[]
  runePowerTotal: number
  activeArtefacts: ArtefactId[]
  cause: 'overload' | 'deck-empty'
  strain: number
  health: number
  targetScore: number
}) {
  trackEvent('Defeat', {
    game: params.gameNumber,
    artefacts: params.activeArtefacts,
    runePower: params.runePowerTotal,
    cause: params.cause,
    strain: params.strain,
    health: params.health,
    targetScore: params.targetScore,
    deck: summarizeDeck(params.deck),
  })
}

export function trackArtefactPurchaseEvent(params: { artefactId: ArtefactId; remainingDust: number }) {
  trackEvent('Artefact Purchase', {
    artefact: params.artefactId,
    remainingDust: params.remainingDust,
  })
}

/**
 * Identify a user.
 */
export function identify(id: string) {
  if (!initialized) return
  try {
    mixpanel.identify(id)
  } catch (e) {
    console.warn('Mixpanel identify failed', e)
  }
}

export default {
  initMixpanel,
  trackEvent,
  identify,
}
