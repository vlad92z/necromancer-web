/**
 * RulesOverlay component - displays game rules explanation
 */

interface RulesOverlayProps {
  onClose: () => void;
}

export function RulesOverlay({ onClose }: RulesOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-6 py-6 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white p-8 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-sky-900">How to Play</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-200 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            aria-label="Close rules overlay"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-base leading-7">
          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">🎯 Goal</h3>
            <p>
              Finish pattern lines to strike immediately. Each placement deals damage based on the segment it connects to.
              The player with the most health wins!
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">🎲 Spell Preparation Phase</h3>
            <p className="space-y-2">
              <span className="block">1. Select a rune from any Runeforge to select all runes of that type</span>
              <span className="block">2. Remaining runes from the Runeforge move to the center</span>
              <span className="block">3. You can also pick runes from the center pool</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">📊 Spellcasting Lines</h3>
            <p className="space-y-1">
              <span className="block">• Each line holds 1-5 runes</span>
              <span className="block">• A line can only hold one type of rune</span>
              <span className="block">• Surplus runes cause overload damage (Solo triggers immediately)</span>
              <span className="block">• Complete a line to add that rune to your wall and clear the line</span>
              <span className="block">• Runes are connected if they share an edge (not diagonal)</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">⚔️ Dealing Damage</h3>
            <p className="space-y-1">
              <span className="block">• When a pattern line fills, its rune moves to your wall immediately</span>
              <span className="block">
                • That rune deals damage right away equal to the size of the connected segment it joins (minimum 1)
              </span>
              <span className="block">• Build dense clusters so every future placement hits harder</span>
              <span className="block">
                • In Solo runs, overload damage still applies the moment you overflow to the floor
              </span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">🏁 End Game</h3>
            <p>The game ends when a player runs out of runes. The player who took the least damage wins!</p>
          </section>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-xl bg-sky-700 px-6 py-3 text-base font-bold text-white transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
