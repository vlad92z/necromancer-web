import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickSoundButton } from '../components/ClickSoundButton'
import { useUIActions } from '../hooks/useGameActions'
import { useClickSound } from '../hooks/useClickSound'
import { useShowSettingsOverlay } from '../hooks/useGameState'
import { SettingsOverlay } from '../components/SettingsOverlay'
import { BREAKPOINTS } from '../styles/tokens'

type MenuAction = 'solo' | 'arena' | 'settings'

const menuItems: ReadonlyArray<{
  id: MenuAction
  title: string
  className: string
}> = [
  { id: 'solo', title: 'Adventure', className: 'pixel-button pixel-button--primary' },
  { id: 'arena', title: 'Arena', className: 'pixel-button pixel-button--primary' },
  { id: 'settings', title: 'Settings', className: 'pixel-button pixel-button--utility' },
]

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()
  const showSettingsOverlay = useShowSettingsOverlay()
  const { closeSettingsOverlay, openSettingsOverlay } = useUIActions()
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.innerWidth < BREAKPOINTS.tablet
  })
  const [activeElement, setActiveElement] = useState<MenuAction | null>(null)
  const buttonRefs = useRef<Record<MenuAction, HTMLButtonElement | null>>({
    solo: null,
    arena: null,
    settings: null,
  })

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
    closeSettingsOverlay()
    navigate('/solo')
  }, [closeSettingsOverlay, navigate])

  const handleArena = useCallback(() => {
    closeSettingsOverlay()
    navigate('/arena')
  }, [closeSettingsOverlay, navigate])

  const handleSettings = useCallback(() => {
    openSettingsOverlay()
  }, [openSettingsOverlay])

  const selectMenuItem = useCallback((item: MenuAction) => {
    setActiveElement(item)
    buttonRefs.current[item]?.focus()
  }, [])

  const menuActions = useMemo<Record<MenuAction, () => void>>(
    () => ({
      solo: handleSolo,
      arena: handleArena,
      settings: handleSettings,
    }),
    [handleArena, handleSettings, handleSolo],
  )

  useEffect(() => {
    if (showSettingsOverlay) {
      setActiveElement(null)
    }
  }, [showSettingsOverlay])

  useEffect(() => closeSettingsOverlay, [closeSettingsOverlay])

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

    const menuOrder = menuItems.map(({ id }) => id)

    const moveSelection = (direction: 'up' | 'down') => {
      if (activeElement === null) {
        selectMenuItem(menuOrder[0])
        playClickSound()
        return
      }

      const currentIndex = menuOrder.indexOf(activeElement)
      const offset = direction === 'down' ? 1 : -1
      const nextIndex = (currentIndex + offset + menuOrder.length) % menuOrder.length
      const next = menuOrder[nextIndex]

      if (next !== activeElement) {
        selectMenuItem(next)
        playClickSound()
      }
    }

    const triggerActiveAction = (element: MenuAction) => {
      playClickSound()
      menuActions[element]()
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
          event.preventDefault()
          if (activeElement === null) {
            selectMenuItem(menuOrder[0])
            playClickSound()
          } else {
            triggerActiveAction(activeElement)
          }
          break
        }
        case 'Escape': {
          event.preventDefault()
          selectMenuItem('settings')
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
  }, [activeElement, handleSettings, isMobileViewport, menuActions, playClickSound, selectMenuItem, showSettingsOverlay])

  return (
    <main className="pixel-screen relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div aria-hidden="true" className="absolute left-[6%] top-[12%] h-4 w-4 bg-[#e15f4f] shadow-[16px_0_0_#e15f4f,0_16px_0_#e15f4f]" />
      <div aria-hidden="true" className="absolute bottom-[16%] right-[8%] h-4 w-4 bg-[#5dc6b0] shadow-[-16px_0_0_#5dc6b0,0_-16px_0_#5dc6b0]" />

      <div className="relative w-full max-w-140">
        <section className="pixel-panel p-2">
          <div className="pixel-panel-inset px-6 text-center md:px-10 md:py-10">
            <h1 className="font-pixel text-4xl uppercase leading-[0.95] tracking-tighter text-[#fff8d8] [text-shadow:4px_4px_0_#141313] md:text-6xl">
              Massive<br /><span className="text-[#f2c14e]">Spell</span>
            </h1>
            <div className="mt-7 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-5 w-5 bg-[#e15f4f]" />
              <span className="h-5 w-5 bg-[#5dc6b0]" />
              <span className="h-5 w-5 bg-[#f2c14e]" />
              <span className="h-5 w-5 bg-[#1cb5cd]" />
              <span className="h-5 w-5 bg-[#623ba8]" />
              <span className="h-5 w-5 bg-[#ffffff]" />
            </div>
            <p className="font-pixel text-xs uppercase tracking-[0.3em] text-[#b5d3bd]">Arcane Arena</p>
          </div>
        </section>
        <div className="mt-5">
          {isMobileViewport ? (
          <div className="pixel-message-panel px-6 py-5 text-center">
            <p className="font-pixel text-sm uppercase text-[#fff8d8]">Desktop spellbook required</p>
            <p className="font-pixel mt-3 text-[11px] leading-5 text-[#b5d3bd]">
              Please use a tablet or desktop device to play Massive Spell: Arcane Arena.
            </p>
          </div>
          ) : (
            <div className="flex w-full flex-col gap-4">
              {menuItems.map(({ id, title, className }) => (
                <ClickSoundButton
                  key={id}
                  ref={(element) => {
                    buttonRefs.current[id] = element
                  }}
                  title={title}
                  className={className}
                  action={menuActions[id]}
                  isActive={activeElement === id}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible')) {
                      setActiveElement(id)
                    }
                  }}
                  onPointerDown={() => setActiveElement(null)}
                />
              ))}
            <p className="font-pixel mt-2 text-center text-[10px] uppercase tracking-[0.08em] text-[#b5d3bd]">↑ ↓ select </p>
            </div>
          )}
        </div>
      </div>

      {showSettingsOverlay && (
        <SettingsOverlay />
      )}
    </main>
  )
}
