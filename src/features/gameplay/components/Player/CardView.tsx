import type { TooltipCardVariant } from '../../../../types/game';

/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  imageSrc: string;
  description: string;
  variant?: TooltipCardVariant;
}

export function CardView({
  title,
  imageSrc,
  description,
  variant = 'default',
}: CardViewProps) {
  const border = 'border rounded-xl border-slate-400/40';
  const showDestroyedOverlay = variant === 'nonPrimary';
  const showOverloadOverlay = variant === 'overload';

  return (
    <div className={`flex flex-col p-2 gap-2 w-[clamp(14em,22vmin,24em)] aspect-[2/3] ${border} bg-gray-900`}>
      <div className="flex-[1] text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-100 pb-0">
        {title}
      </div>

      <div className={`flex-[4] ${border} bg-gradient-to-b from-slate-700/80 to-slate-900 overflow-hidden min-h-0 relative`}>
        <img
          className="h-full w-full object-cover"
          src={imageSrc}
          alt={title}
        />
        {showDestroyedOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: 'linear-gradient(45deg, transparent 46%, rgba(70, 40, 100, 0.8) 46%, rgba(70, 40, 100, 0.8) 54%, transparent 54%)',
            }}
          />
        )}
        {showOverloadOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
            }}
          />
        )}
      </div>

      <div className={`flex-[4] ${border} bg-slate-950/70 px-3 py-3 tracking-[0.1em] leading-relaxed text-slate-100/90`}>
        {description}
      </div>
    </div>
  );
}
