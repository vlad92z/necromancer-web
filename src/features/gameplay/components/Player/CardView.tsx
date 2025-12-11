/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  imageSrc: string;
  description: string;
}

export function CardView({ title, imageSrc, description }: CardViewProps) {
  return (
    <div
      className="relative h-full max-h-full w-auto max-w-full aspect-[2.5/3.5] overflow-hidden rounded-2xl border border-slate-400/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 shadow-[0_20px_38px_rgba(0,0,0,0.55)]"
    >
      <div className="absolute inset-[10px] rounded-xl border border-slate-500/35 bg-slate-900/60 backdrop-blur-[1px] shadow-inner" />
      <div className="relative z-[1] flex h-full flex-col">
        <div className="px-5 pt-4 pb-3 text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-100 drop-shadow-[0_1px_6px_rgba(255,255,255,0.12)]">
          {title}
        </div>
        <div className="flex flex-1 flex-col gap-3 px-4 pb-5">
          <div className="flex-[0.9] rounded-xl border border-slate-600/45 bg-gradient-to-b from-slate-800/80 to-slate-900/70 shadow-inner">
            <div className="flex h-full items-center justify-center p-3">
              <img
                src={imageSrc}
                alt={title}
                className="max-h-full max-w-full object-contain drop-shadow-[0_16px_24px_rgba(100,255,214,0.3)]"
              />
            </div>
          </div>
          <div className="flex-[1.1] rounded-xl border border-slate-700/50 bg-slate-950/70 px-3 py-3 text-xs leading-relaxed text-slate-100/90 shadow-inner">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
