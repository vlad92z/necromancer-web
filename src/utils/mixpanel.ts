/**
 * Mixpanel - small wrapper for mixpanel-browser
 *
 * Placed in `src/utils/` to keep analytics logic pure and reusable.
 */
import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN
let initialized = false

/**
 * Initialize Mixpanel. Safe to call multiple times.
 * Reads token from `token` param or `import.meta.env.VITE_MIXPANEL_TOKEN`.
 */
export function initMixpanel(token?: string) {
  if (typeof window === 'undefined') return
  if (initialized) return

  const finalToken = token ?? MIXPANEL_TOKEN;
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.warn('Mixpanel track failed', e)
  }
}

/**
 * Identify a user.
 */
export function identify(id: string) {
  if (!initialized) return
  try {
    mixpanel.identify(id)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Mixpanel identify failed', e)
  }
}

export default {
  initMixpanel,
  trackEvent,
  identify,
}
