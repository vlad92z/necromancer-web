import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickSoundButton } from '../components/ClickSoundButton'
import { useClickSound } from '../hooks/useClickSound'
import { gradientButtonClasses, simpleButtonClasses } from '../styles/gradientButtonClasses'
import { SettingsOverlay } from '../components/SettingsOverlay'
import { useUIStore } from '../state/stores/uiStore'
import { BREAKPOINTS } from '../styles/tokens'

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay)
  const toggleSettingsOverlay = useUIStore((state) => state.toggleSettingsOverlay)
  const soundVolume = useUIStore((state) => state.soundVolume)
  const setSoundVolume = useUIStore((state) => state.setSoundVolume)
  const isMusicMuted = useUIStore((state) => state.isMusicMuted)
  const setMusicMuted = useUIStore((state) => state.setMusicMuted)
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.innerWidth < BREAKPOINTS.tablet
  })
  const [activeElement, setActiveElement] = useState<'solo' | 'settings' | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < BREAKPOINTS.tablet)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSolo = useCallback(() => {
    navigate('/solo')
  }, [navigate])

  const handleSettings = useCallback(() => {
    toggleSettingsOverlay()
  }, [toggleSettingsOverlay])

  const handleToggleMusic = () => {
    setMusicMuted(!isMusicMuted)
  }

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number.parseFloat(event.currentTarget.value)
    if (!Number.isFinite(nextValue)) {
      return
    }
    setSoundVolume(nextValue / 100)
  }

  useEffect(() => {
    if (showSettingsOverlay) {
      setActiveElement(null)
    }
  }, [showSettingsOverlay])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleMouseMove = () => {
      setActiveElement((current) => (current === null ? current : null))
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const menuOrder: Array<'solo' | 'settings'> = ['solo', 'settings']

    const moveSelection = (direction: 'up' | 'down') => {
      setActiveElement((current) => {
        const next = (() => {
          if (current === null) {
            return menuOrder[0]
          }

          const currentIndex = menuOrder.indexOf(current)
          const offset = direction === 'down' ? 1 : -1
          const nextIndex = (currentIndex + offset + menuOrder.length) % menuOrder.length

          return menuOrder[nextIndex]
        })()

        if (next !== current) {
          playClickSound()
        }

        return next
      })
    }

    const triggerActiveAction = (element: 'solo' | 'settings' | null) => {
      if (element === 'solo') {
        playClickSound()
        handleSolo()
        return
      }

      if (element === 'settings') {
        playClickSound()
        handleSettings()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isMobileViewport || showSettingsOverlay) {
        return
      }

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault()
          moveSelection('up')
          break
        }
        case 'ArrowDown': {
          event.preventDefault()
          moveSelection('down')
          break
        }
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          if (activeElement !== null) {
            event.preventDefault()
            triggerActiveAction(activeElement)
          }
          break
        }
        case 'Escape': {
          console.log('Main Menu Escape pressed')
          event.preventDefault()
          setActiveElement('settings')
          playClickSound()
          handleSettings()
          break
        }
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeElement, handleSettings, handleSolo, isMobileViewport, playClickSound, showSettingsOverlay])

  const soloButtonClasses = `${gradientButtonClasses} data-[active=true]:from-sky-400 data-[active=true]:to-purple-600 data-[active=true]:-translate-y-0.5 data-[active=true]:border data-[active=true]:border-slate-300`
  const settingsButtonClasses = `${simpleButtonClasses} data-[active=true]:border-slate-300 data-[active=true]:bg-slate-800`

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0b1024] px-6 py-10 text-white">
      <div className="flex flex-col items-center text-center space-y-2">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-100 md:text-5xl">
          Massive Spell: Arcane Arena
        </h1>
        <p className="text-lg text-slate-300">A roguelite deck-builder</p>
      </div>

      {isMobileViewport ? (
        <div className="mt-10 w-full max-w-[360px] rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-5 text-center text-slate-200 shadow-md">
          <p className="text-lg font-semibold uppercase tracking-wide">Not available on mobile</p>
          <p className="mt-2 text-sm text-slate-300">
            Please use a tablet or desktop device to play Massive Spell: Arcane Arena.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 flex w-full max-w-[320px] flex-col gap-4">
            <ClickSoundButton
              title="Solo"
              className={soloButtonClasses}
              action={handleSolo}
              isActive={activeElement === 'solo'}
            />
            <ClickSoundButton
              title="Settings"
              className={settingsButtonClasses}
              action={handleSettings}
              isActive={activeElement === 'settings'}
            />
          </div>

          {showSettingsOverlay && (
            <SettingsOverlay
              onClose={toggleSettingsOverlay}
              soundVolume={soundVolume}
              isMusicMuted={isMusicMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMusic={handleToggleMusic}
              showQuitRun={false}
              playClickSound={playClickSound}
            />
          )}
        </>
      )}
    </main>
  )
}
