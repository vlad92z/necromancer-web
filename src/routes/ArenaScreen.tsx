import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClickSoundButton } from '../components/ClickSoundButton';
import { ArenaEnemyOverlay } from '../features/arena/components/ArenaEnemyOverlay';
import { useClickSound } from '../hooks/useClickSound';
import type { MonsterId } from '../types/game';
import { getArenaMonsterDetails } from '../utils/arenaCatalog';
import { MONSTER_CATALOG } from '../utils/monsterCatalog';

const monsters = Object.values(MONSTER_CATALOG);

export function ArenaScreen() {
  const navigate = useNavigate();
  const playClickSound = useClickSound();
  const [selectedMonsterId, setSelectedMonsterId] = useState<MonsterId | null>(null);
  const [activeMonsterId, setActiveMonsterId] = useState<MonsterId | null>(null);
  const monsterButtonRefs = useRef<Record<MonsterId, HTMLButtonElement | null>>({
    goblin: null,
    'golem-lord': null,
  });
  const selectedDetails = useMemo(
    () => selectedMonsterId ? getArenaMonsterDetails(selectedMonsterId) : null,
    [selectedMonsterId],
  );

  const focusMonster = useCallback((monsterId: MonsterId) => {
    setActiveMonsterId(monsterId);
    monsterButtonRefs.current[monsterId]?.focus();
  }, []);

  const openMonster = useCallback((monsterId: MonsterId) => {
    playClickSound();
    setSelectedMonsterId(monsterId);
  }, [playClickSound]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const clearKeyboardSelection = () => setActiveMonsterId(null);
    window.addEventListener('mousemove', clearKeyboardSelection);
    return () => window.removeEventListener('mousemove', clearKeyboardSelection);
  }, []);

  const handleGridKeyDown = useCallback((event: KeyboardEvent) => {
    if (selectedMonsterId) {
      return;
    }

    const monsterIds = monsters.map(({ id }) => id);
    const focusedMonsterId = monsterIds.find((monsterId) => (
      monsterButtonRefs.current[monsterId] === document.activeElement
    )) ?? activeMonsterId;
    const currentIndex = focusedMonsterId === null ? -1 : monsterIds.indexOf(focusedMonsterId);

    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + direction + monsterIds.length) % monsterIds.length;
      focusMonster(monsterIds[nextIndex]);
      playClickSound();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      if (focusedMonsterId === null) {
        focusMonster(monsterIds[0]);
        playClickSound();
      } else {
        openMonster(focusedMonsterId);
      }
    }
  }, [activeMonsterId, focusMonster, openMonster, playClickSound, selectedMonsterId]);

  useEffect(() => {
    window.addEventListener('keydown', handleGridKeyDown);
    return () => window.removeEventListener('keydown', handleGridKeyDown);
  }, [handleGridKeyDown]);

  return (
    <main className="pixel-screen min-h-screen px-6 py-8 font-pixel md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="pixel-panel p-2">
          <div className="pixel-panel-inset flex flex-wrap items-center justify-between gap-5 px-6 py-6 md:px-8">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[#f2c14e]">Enemy Catalogue</div>
              <h1 className="font-pixel text-3xl uppercase tracking-[0.12em] text-[#fff8d8] [text-shadow:3px_3px_0_#141313] md:text-4xl">
                Arena
              </h1>
              <p className="mt-3 text-[10px] uppercase tracking-[0.1em] text-[#b5d3bd]">
                Inspect turn cycles and possible loot
              </p>
            </div>
            <ClickSoundButton
              title="Back to Menu"
              action={() => navigate('/')}
              className="pixel-game-button px-5 py-4 text-xs tracking-[0.1em]"
            />
          </div>
        </header>

        <section aria-label="Enemies" className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          {monsters.map((monster) => (
            <button
              key={monster.id}
              ref={(element) => {
                monsterButtonRefs.current[monster.id] = element;
              }}
              type="button"
              onClick={() => openMonster(monster.id)}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) {
                  setActiveMonsterId(monster.id);
                }
              }}
              onPointerDown={() => setActiveMonsterId(null)}
              data-active={activeMonsterId === monster.id ? 'true' : undefined}
              className="pixel-game-panel group flex min-h-105 flex-col p-5 text-left focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fff8d8] data-[active=true]:outline-4 data-[active=true]:outline-offset-4 data-[active=true]:outline-[#ffdc52]"
              aria-label={`View ${monster.name} details`}
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="pixel-section-title text-xl">{monster.name}</h2>
                {monster.isBoss && (
                  <span className="pixel-game-stat bg-[#8d3030] px-2.5 py-2 text-[9px] uppercase tracking-[0.12em] text-[#fff8d8]">
                    Boss
                  </span>
                )}
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center py-5">
                <img
                  src={monster.imageSrc}
                  alt={monster.name}
                  className="h-64 w-full object-contain [image-rendering:pixelated] drop-shadow-[7px_7px_0_#141313] group-hover:translate-y-[-4px]"
                />
              </div>

              <div className="mt-auto w-full">
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-[#fff8d8]">
                  <span>Health</span>
                  <span>{monster.maxHealth} / {monster.maxHealth}</span>
                </div>
                <div className="pixel-health-track" aria-label={`${monster.maxHealth} of ${monster.maxHealth} health`}>
                  <div className="pixel-health-fill w-full" />
                </div>
              </div>
            </button>
          ))}
        </section>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.1em] text-[#b5d3bd]">
          Arrow keys select · Enter opens
        </p>
      </div>

      {selectedDetails && (
        <ArenaEnemyOverlay details={selectedDetails} onClose={() => setSelectedMonsterId(null)} />
      )}
    </main>
  );
}
