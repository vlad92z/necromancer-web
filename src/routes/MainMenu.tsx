import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClickSound } from '../hooks/useClickSound'
import { gradientButtonClasses } from '../styles/gradientButtonClasses'
import { SettingsOverlay } from '../components/SettingsOverlay'
import { useUIStore } from '../state/stores/uiStore'

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay)
  const toggleSettingsOverlay = useUIStore((state) => state.toggleSettingsOverlay)
  const soundVolume = useUIStore((state) => state.soundVolume)
  const setSoundVolume = useUIStore((state) => state.setSoundVolume)
  const isMusicMuted = useUIStore((state) => state.isMusicMuted)
  const setMusicMuted = useUIStore((state) => state.setMusicMuted)

  const handleSolo = () => {
    playClickSound()
    navigate('/solo')
  }

  const handleSettings = () => {
    playClickSound()
    toggleSettingsOverlay()
  }

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0b1024] px-6 py-10 text-white">
      <div className="flex flex-col items-center text-center space-y-2">
        <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-100 md:text-5xl">
          Massive Spell: Arcane Arena
        </h1>
        <p className="text-lg text-slate-300">A roguelite deck-builder</p>
      </div>

      <div className="mt-10 flex w-full max-w-[320px] flex-col gap-4">
        <button
          type="button"
          className={`${gradientButtonClasses} px-10 py-4 text-lg font-bold uppercase tracking-[0.25em] focus-visible:outline-slate-900`}
          onClick={handleSolo}
        >
          Solo
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-10 py-4 text-lg font-bold uppercase tracking-[0.25em] text-slate-100 transition hover:border-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          onClick={handleSettings}
        >
          Settings
        </button>
      </div>

      <SettingsOverlay
        isOpen={showSettingsOverlay}
        onClose={toggleSettingsOverlay}
        soundVolume={soundVolume}
        isMusicMuted={isMusicMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMusic={handleToggleMusic}
        showQuitRun={false}
      />
    </main>
  )
}
