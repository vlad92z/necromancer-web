import { useNavigate } from 'react-router-dom'
import { useClickSound } from '../hooks/useClickSound'

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()

  const handleSolo = () => {
    playClickSound()
    navigate('/solo')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="flex flex-col items-center text-center">
        <h1 className="mb-3 text-4xl font-bold md:text-5xl">Massive Spell: Arcane Arena</h1>
        <p className="text-lg text-slate-400">A roguelite deck-builder</p>
      </div>

      <div className="mt-10 flex w-full max-w-[320px] flex-col gap-4">
        <button
          type="button"
          className="rounded-lg bg-sky-500 px-8 py-4 text-lg font-bold text-white transition transform duration-200 hover:bg-sky-400 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/50"
          onClick={handleSolo}
        >
          Solo
        </button>
      </div>
    </main>
  )
}
