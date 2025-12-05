/**
 * StartGameScreen component - displays welcome screen before game begins
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuickPlayOpponent, RuneTypeCount } from '../../../types/game';
import { backLinkClasses, primaryActionClasses, secondaryActionClasses, viewShellClasses } from '../../../styles/uiClasses';
import { RulesOverlay } from './RulesOverlay';

interface StartGameScreenProps {
  onStartGame: (topController: QuickPlayOpponent, runeTypeCount: RuneTypeCount) => void;
}

const cardClasses =
  'w-full max-w-3xl rounded-2xl border border-sky-400/15 bg-[linear-gradient(145deg,_rgba(15,23,36,0.95),_rgba(9,12,22,0.92))] px-7 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.65)]';
const sectionClasses = 'space-y-3 rounded-xl border border-sky-400/15 bg-slate-900/60 p-4 text-left';
const sectionTitleClasses = 'text-sm font-semibold uppercase tracking-[0.18em] text-sky-200';
const pillButtonBase =
  'flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300';
const pillButtonActive =
  'border-transparent bg-gradient-to-br from-sky-500 to-blue-500 text-slate-950 shadow-[0_14px_36px_rgba(56,189,248,0.3)]';
const pillButtonInactive =
  'border-white/10 bg-transparent text-slate-200 hover:border-sky-400/60 hover:bg-slate-900/60';
const supportTextClasses = 'text-xs text-sky-300';

export function StartGameScreen({ onStartGame }: StartGameScreenProps) {
  const navigate = useNavigate();
  const [opponentSetting, setOpponentSetting] = useState<QuickPlayOpponent>('normal');
  const [runeTypeCount, setRuneTypeCount] = useState<RuneTypeCount>(5);
  const [showRules, setShowRules] = useState(false);
  
  return (
    <div className={viewShellClasses}>
      <div className={cardClasses}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/')} className={backLinkClasses}>
            ← Back
          </button>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Quick Play</div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-5xl font-extrabold uppercase tracking-tight text-slate-50">Massive Spell</h1>
          <h2 className="text-xl font-semibold text-sky-300">Arcane Arena</h2>
        </div>

        <div className="mt-5 space-y-3 text-base leading-relaxed text-slate-200">
          <p>Prepare powerful runes from mystical Runeforges and craft strategic spell patterns.</p>
          <p>Complete your Spellcasting Lines and place runes on your Spell Wall to unleash devastating combos!</p>
        </div>

        <div className="mt-6 space-y-5">
          <section className={sectionClasses}>
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-sky-100">Rune Types</div>
            </div>
            <div className="flex gap-3">
              {[3, 4, 5].map((count) => {
                const isActive = runeTypeCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setRuneTypeCount(count as RuneTypeCount)}
                    className={`${pillButtonBase} ${isActive ? pillButtonActive : pillButtonInactive}`}
                  >
                    {count} Types
                  </button>
                );
              })}
            </div>
            <p className={supportTextClasses}>
              {runeTypeCount === 3 && '3 rune types (Fire, Life, Wind) with 3x3 wall and 3 pattern lines'}
              {runeTypeCount === 4 && '4 rune types (Fire, Life, Wind, Frost) with 4x4 wall and 4 pattern lines'}
              {runeTypeCount === 5 && '5 rune types (Fire, Life, Wind, Frost, Void) with 5x5 wall and 5 pattern lines'}
            </p>
          </section>

          <section className={sectionClasses}>
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-sky-100">Difficulty</div>
              <div className={sectionTitleClasses}>Top Player</div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(['human', 'easy', 'normal', 'hard'] as QuickPlayOpponent[]).map((setting) => {
                const isActive = opponentSetting === setting;
                return (
                  <button
                    key={setting}
                    type="button"
                    onClick={() => setOpponentSetting(setting)}
                    className={`${pillButtonBase} ${isActive ? pillButtonActive : pillButtonInactive}`}
                  >
                    {'Human'}
                  </button>
                );
              })}
            </div>
            <p className={supportTextClasses}>
              Choose who controls the top player. Selecting Human lets one person play both sides.
            </p>
          </section>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => onStartGame(opponentSetting, runeTypeCount)}
            className={primaryActionClasses}
          >
            Start Game
          </button>
          <button type="button" onClick={() => setShowRules(true)} className={secondaryActionClasses}>
            📖 How to Play
          </button>
        </div>
      </div>

      {showRules && <RulesOverlay onClose={() => setShowRules(false)} />}
    </div>
  );
}
