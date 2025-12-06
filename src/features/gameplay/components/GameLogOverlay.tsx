/**
 * GameLogOverlay component - displays history of previous rounds
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ChapterScore } from '../../../types/game';

interface GameLogOverlayProps {
  chapterHistory: ChapterScore[];
  onClose: () => void;
}

export function GameLogOverlay({ chapterHistory, onClose }: GameLogOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-6 py-6 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-white p-8 text-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-sky-900">Game Log</h2>
              <p className="mt-1 text-sm text-slate-500">Round-by-round damage history</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {chapterHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50 px-12 py-10 text-center text-slate-500">
                <div className="mb-4 text-6xl">📜</div>
                <p className="text-lg font-bold">No chapters completed yet</p>
              </div>
            ) : (
              chapterHistory.map((chapterScore, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3"
                >
                  <div className="text-base font-bold text-sky-900">Chapter {chapterScore.chapter}</div>

                  {index < chapterHistory.length - 1 && (
                    <div className="mt-3 border-b border-dashed border-slate-300" />
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
