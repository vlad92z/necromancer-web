import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickSoundButton } from '../components/ClickSoundButton'
import { useUIActions } from '../hooks/useGameActions'
import { useClickSound } from '../hooks/useClickSound'
import { useShowSettingsOverlay } from '../hooks/useGameState'
import { SettingsOverlay } from '../components/SettingsOverlay'
import { BREAKPOINTS } from '../styles/tokens'

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()
  const showSettingsOverlay = useShowSettingsOverlay()
  const { toggleSettingsOverlay } = useUIActions()
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
            return menuOrder[1]
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

  const pixelButtonBase = 'font-pixel w-full border-4 border-[#141313] px-7 py-7 text-center text-base leading-none tracking-[0.5em] text-[#171518] shadow-[7px_7px_0_#141313] transition-none hover:bg-[#fff8d8] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fff8d8] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[3px_3px_0_#141313] data-[active=true]:bg-[#fff8d8] data-[active=true]:outline data-[active=true]:outline-4 data-[active=true]:outline-offset-4 data-[active=true]:outline-[#ffdc52]'
  const soloButtonClasses = `${pixelButtonBase} bg-[#e15f4f] text-[#fff8d8] hover:bg-[#f27661] data-[active=true]:bg-[#f27661]`
  const settingsButtonClasses = `${pixelButtonBase} bg-[#efe7c3]`

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#202827] px-6 py-10 text-[#fff8d8]">
      <div aria-hidden="true" className="absolute left-[6%] top-[12%] h-4 w-4 bg-[#e15f4f] shadow-[16px_0_0_#e15f4f,0_16px_0_#e15f4f]" />
      <div aria-hidden="true" className="absolute bottom-[16%] right-[8%] h-4 w-4 bg-[#5dc6b0] shadow-[-16px_0_0_#5dc6b0,0_-16px_0_#5dc6b0]" />
      <div aria-hidden="true" className="absolute left-[18%] bottom-[10%] hidden h-3 w-3 bg-[#f2c14e] shadow-[12px_0_0_#f2c14e,0_12px_0_#f2c14e] md:block" />

      <div className="relative w-full max-w-140">
        <section className="border-4 border-[#141313] bg-[#354542] p-2 shadow-[10px_10px_0_#141313]">
          <div className="border-4 border-[#98b6a7] bg-[#293532] px-6 py-8 text-center md:px-10 md:py-10">
            <h1 className="font-pixel text-4xl uppercase leading-[0.95] tracking-tighter text-[#fff8d8] [text-shadow:4px_4px_0_#141313] md:text-6xl">
              Massive<br /><span className="text-[#f2c14e]">Spell</span>
            </h1>
            <div className="mt-7 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-3 w-3 bg-[#e15f4f]" />
              <span className="h-3 w-3 bg-[#5dc6b0]" />
              <span className="h-3 w-3 bg-[#f2c14e]" />
            </div>
            <p className="font-pixel mt-4 text-xs uppercase tracking-[0.2em] text-[#b5d3bd]">Arcane Arena</p>
          </div>
        </section>

        {isMobileViewport ? (
          <div className="mt-8 border-4 border-[#141313] bg-[#354542] px-6 py-5 text-center shadow-[6px_6px_0_#141313]">
            <p className="font-pixel text-sm uppercase text-[#fff8d8]">Desktop spellbook required</p>
            <p className="font-pixel mt-3 text-[11px] leading-5 text-[#b5d3bd]">
              Please use a tablet or desktop device to play Massive Spell: Arcane Arena.
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-8 flex w-full flex-col gap-6">
              <ClickSoundButton
                title="Adventure"
                className={soloButtonClasses}
                action={handleSolo}
                isActive={activeElement === 'solo'}
              />
              <ClickSoundButton
                title="Arena"
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
            <p className="font-pixel mt-2 text-center text-[10px] uppercase tracking-[0.08em] text-[#b5d3bd]">↑ ↓ select · enter confirm</p>
          </div>
        )}
      </div>

      {showSettingsOverlay && (
        <SettingsOverlay />
      )}
    </main>
  )
}
