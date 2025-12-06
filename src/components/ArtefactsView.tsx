/**
 * ArtefactsView - modal for selecting and purchasing artefacts
 */

import { Modal } from './layout/Modal';
import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS, getAllArtefacts, MAX_SELECTED_ARTEFACTS } from '../types/artefacts';
import { useArtefactStore } from '../state/stores/artefactStore';
import { getArtefactEffectDescription } from '../utils/artefactEffects';

interface ArtefactsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArtefactsView({ isOpen, onClose }: ArtefactsViewProps) {
  const { selectedArtefactIds, ownedArtefactIds, arcaneDust, selectArtefact, unselectArtefact, buyArtefact } = useArtefactStore();

  const allArtefacts = getAllArtefacts();

  const handleArtefactClick = (artefactId: ArtefactId) => {
    if (selectedArtefactIds.includes(artefactId)) {
      unselectArtefact(artefactId);
    } else if (ownedArtefactIds.includes(artefactId)) {
      selectArtefact(artefactId);
    }
  };

  const handleBuyClick = (artefactId: ArtefactId, event: React.MouseEvent) => {
    event.stopPropagation();
    buyArtefact(artefactId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Artefacts" maxWidth={800}>
      <div className="space-y-6">
        {/* Arcane Dust Display */}
        <div className="flex items-center justify-between rounded-xl border border-amber-300/30 bg-amber-100/5 px-4 py-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">Arcane Dust</span>
          <span className="text-2xl font-extrabold text-amber-200">{arcaneDust.toLocaleString()}</span>
        </div>

        {/* Selected Artefacts Row */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
            Selected Artefacts ({selectedArtefactIds.length}/{MAX_SELECTED_ARTEFACTS})
          </h3>
          <div className="min-h-[80px] rounded-xl border border-slate-600/40 bg-slate-900/50 p-4">
            {selectedArtefactIds.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {selectedArtefactIds.map((artefactId) => {
                  const artefact = ARTEFACTS[artefactId];
                  if (!artefact) return null;

                  return (
                    <button
                      key={artefactId}
                      onClick={() => unselectArtefact(artefactId)}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-sky-400/50 bg-slate-800 shadow-lg transition hover:border-sky-400 hover:shadow-xl"
                      title={`${artefact.name}\n${getArtefactEffectDescription(artefactId)}`}
                    >
                      <img
                        src={artefact.image}
                        alt={artefact.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-red-500/0 transition group-hover:bg-red-500/20" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* All Artefacts Grid */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">All Artefacts</h3>
          <div className="grid grid-cols-5">
            {allArtefacts.map((artefact) => {
              const isOwned = ownedArtefactIds.includes(artefact.id);
              const isSelected = selectedArtefactIds.includes(artefact.id);
              const canAfford = arcaneDust >= artefact.cost;
              const effectDescription = getArtefactEffectDescription(artefact.id);

              return (
                <div
                  key={artefact.id}

                  className={`h-32 w-32 relative cursor-pointer overflow-hidden rounded-xl border transition ${
                    isOwned
                      ? isSelected
                        ? 'border-sky-400 bg-slate-800 shadow-lg'
                        : 'border-slate-600/50 bg-slate-900/50 hover:border-slate-500'
                      : 'border-slate-700/40 bg-slate-900/30'
                  }`}
                  onClick={() => handleArtefactClick(artefact.id)}
                  title={ `${artefact.name}\n${effectDescription}`}
                >
                  {/* Artefact Image */}
                  <div className={`aspect-square ${isOwned ? 'opacity-100' : 'opacity-40'}`}>
                    <img
                      src={artefact.image}
                      alt={artefact.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Artefact Name */}
                  <div className="border-t border-slate-700/50 bg-slate-900/70 px-2 py-2 text-center">
                    <div className="text-xs font-semibold text-slate-300">{artefact.name}</div>
                  </div>

                  {/* Buy Button for unowned artefacts */}
                  {!isOwned && (
                    <button
                      onClick={(e) => handleBuyClick(artefact.id, e)}
                      disabled={!canAfford}
                      className={`absolute bottom-2 right-2 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide transition ${
                        canAfford
                          ? 'border border-amber-400/50 bg-amber-500/90 text-slate-900 hover:bg-amber-400'
                          : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500'
                      }`}
                    >
                      {artefact.cost}
                    </button>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute left-2 top-2 rounded-full border border-sky-400 bg-sky-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
