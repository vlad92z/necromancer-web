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
              Defeat each enemy by casting runes into your spell wall while keeping your health above zero.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">🎲 Your Turn</h3>
            <p className="space-y-2">
              <span className="block">1. Select a rune from your hand</span>
              <span className="block">2. Click a matching empty wall slot to charge it</span>
              <span className="block">3. Final charges place the rune and resolve its effect</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">📊 Wall Charges</h3>
            <p className="space-y-1">
              <span className="block">• Each wall row needs one more charge than the row above it</span>
              <span className="block">• A charged slot shows progress like 1/3 until complete</span>
              <span className="block">• Wrong rune types are rejected and stay selected</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">⚔️ Combat</h3>
            <p className="space-y-1">
              <span className="block">• Damage lowers enemy HP</span>
              <span className="block">• Healing restores health up to your max health</span>
              <span className="block">• Armor absorbs enemy attacks before health</span>
              <span className="block">• End Turn discards your hand, the enemy attacks, then you draw up to six cards</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-semibold text-sky-700">🏁 Victory</h3>
            <p>When an enemy reaches 0 HP, choose a deck draft reward before starting the next encounter.</p>
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
