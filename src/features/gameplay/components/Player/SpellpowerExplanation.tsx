/**
 * SpellpowerExplanation - extracted explanation popup for Spellpower
 */

export interface SpellpowerExplanationProps {
  onClose: () => void;
}

export function SpellpowerExplanation({ onClose }: SpellpowerExplanationProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 0, 12, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'rgba(8, 3, 22, 0.95)',
          borderRadius: '24px',
          padding: '32px',
          width: 'min(520px, 90vw)',
          color: '#f5f3ff',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '26px',
          color: '#c084fc',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          Segment Damage
        </h2>

        <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#d3cffa' }}>
          <div style={{ marginBottom: '18px' }}>
            <strong style={{ color: '#38bdf8' }}>Immediate Hits</strong>
            <p style={{ margin: '6px 0 0 0' }}>
              Finish a pattern line and its rune jumps to your wall right away. That placement deals damage instantly based on the connected segment it joins.
            </p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <strong style={{ color: '#facc15' }}>Segment Size</strong>
            <p style={{ margin: '6px 0 0 0' }}>
              Count every rune touching the new placement (up, down, left, right). That count is the damage dealt, with a minimum hit of 1 even when isolated.
            </p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <strong style={{ color: '#c084fc' }}>Building Power</strong>
            <p style={{ margin: '6px 0 0 0' }}>
              Bigger clusters mean every future placement into that segment hits harder. Stack runes together to ramp up damage, and watch overload damage in Solo when you spill to the floor.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#a855f7',
            color: '#f5f3ff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default SpellpowerExplanation;
