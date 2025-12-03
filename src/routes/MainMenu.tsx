import { useNavigate } from 'react-router-dom'
import { useClickSound } from '../hooks/useClickSound'
import { gradientButtonClasses } from '../styles/gradientButtonClasses'

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()

  const handleSolo = () => {
    playClickSound()
    navigate('/solo')
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
      </div>
    </main>
  )
}
