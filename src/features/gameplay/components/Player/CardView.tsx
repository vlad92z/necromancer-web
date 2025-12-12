/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  imageSrc: string;
  description: string;
}

export function CardView({ title, imageSrc, description }: CardViewProps) {
  const border = 'rounded-xl border border-slate-400/40';
  return (
    <div className={`flex flex-col p-3 pt-2 gap-2 w-[clamp(140px,22vmin,240px)] aspect-[2/3] flex-shrink-0 ${border} bg-gray-900`}>
      <div className="flex-[1] items-center justify-center text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-100">
        {title}
      </div>

      <img className={`flex-[4] ${border} bg-gradient-to-b from-slate-700/80 to-slate-900 overflow-hidden`}
        src={imageSrc}
        alt={title}
      />

      <div className={`flex-[4] border ${border} bg-slate-950/70 px-3 py-3 text-lg leading-relaxed text-slate-100/90 shadow-inner min-h-0`}>
        {description}
      </div>
    </div>
  );
}
