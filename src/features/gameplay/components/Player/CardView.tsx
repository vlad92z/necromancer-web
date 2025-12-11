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
    <div className="p-3 relative h-full max-h-full w-auto max-w-full aspect-[2/3] overflow-hidden rounded-2xl border border-slate-400/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 shadow-[0_20px_38px_rgba(0,0,0,0.55)]">
        <div className="pb-1 text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-100 drop-shadow-[0_1px_6px_rgba(255,255,255,0.12)]">
          {title}
        </div>
        <div className="flex-1 rounded-xl border border-slate-600/45 bg-gradient-to-b from-slate-800/80 to-slate-900/70 shadow-inner min-h-0 overflow-hidden">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover drop-shadow-[0_16px_24px_rgba(100,255,214,0.3)]"
            />
          </div>
          <div className="flex-1 rounded-xl border border-slate-700/50 bg-slate-950/70 px-3 py-3 text-xs leading-relaxed text-slate-100/90 shadow-inner overflow-auto min-h-0">
            {description}
          </div>
    </div>
  );
}
