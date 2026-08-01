/**
 * RulesOverlay component - displays game rules explanation
 */

interface RulesOverlayProps {
  onClose: () => void;
}

export function RulesOverlay({ onClose }: RulesOverlayProps) {
  return (
    <div
      className="pixel-modal-backdrop fixed inset-0 z-100 flex items-center justify-center px-6 py-6"
      onClick={onClose}
    >
      <div
        className="pixel-modal w-full max-w-3xl p-2 font-pixel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal__inner p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="pixel-section-title text-3xl">How to Play</h2>
          <button
            type="button"
            onClick={onClose}
            className="pixel-icon-button"
            aria-label="Close rules overlay"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-xs leading-6 text-[#fff8d8]">
          <section className="space-y-2">
            <h3 className="text-sm text-[#f2c14e]">🎯 Goal</h3>
            <p>
              Defeat each enemy by casting runes into your spell wall while keeping your health above zero.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm text-[#f2c14e]">🎲 Your Turn</h3>
            <p className="space-y-2">
              <span className="block">1. Select a rune from your hand</span>
              <span className="block">2. Click any empty wall slot to place it</span>
              <span className="block">3. Placed runes resolve their effects immediately</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm text-[#f2c14e]">📊 Wall Slots</h3>
            <p className="space-y-1">
              <span className="block">• Every rune takes one action to place, regardless of rarity or row</span>
              <span className="block">• Every empty slot accepts any rune type</span>
              <span className="block">• Filled slots cannot accept another rune</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm text-[#f2c14e]">⚔️ Combat</h3>
            <p className="space-y-1">
              <span className="block">• Damage lowers enemy HP</span>
              <span className="block">• Healing restores health up to your max health</span>
              <span className="block">• Armor absorbs enemy attacks before health</span>
              <span className="block">• End Turn discards your hand, the enemy attacks, then you draw up to six cards</span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm text-[#f2c14e]">🏁 Victory</h3>
            <p>When an enemy reaches 0 HP, choose a deck draft reward before starting the next encounter.</p>
          </section>

          <button
            type="button"
            onClick={onClose}
            className="pixel-game-button mt-2 w-full bg-[#e15f4f] px-6 py-4 text-sm text-[#fff8d8]"
          >
            Got it!
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
