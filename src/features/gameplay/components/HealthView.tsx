/**
 * ProgressStatOverlay - animated stat block with delta indicator and progress bar
 */
import { motion } from 'framer-motion';
import { useArmorChangeSound } from '../../../hooks/useArmorChangeSound';
import { useSoloGameStore } from '../../../state/stores/soloGameStore';

export function HealthView() {
  const currentHealth = useSoloGameStore((state) => state.playerStats.currentHealth);
  const maxHealth = useSoloGameStore((state) => state.playerStats.maxHealth);
  const currentArmor = useSoloGameStore((state) => state.playerStats.currentArmor);
  useArmorChangeSound(currentArmor);
  const progress = Math.min(1, currentHealth / maxHealth);
  const progressPercent = Math.round(progress * 100);

  return (
    <div className={`w-full flex flex-col gap-2 py-3 px-3.5`}>
      <div className="flex items-center justify-between">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">HEALTH</div>
        <div className="flex flex-row gap-5">
          <motion.span className='text-red-500 font-extrabold text-base text-right'>
            {`${currentHealth} / ${maxHealth}`}
          </motion.span>
          <motion.span className='text-blue-400 font-extrabold text-base text-right'>
            {`🛡${currentArmor}`}
          </motion.span>
        </div>
      </div>
      <div className={'rounded-full overflow-hidden relative h-[10px] bg-red-500/15'}>
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-red-700`}
          initial={{ width: `${progressPercent}%` }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
