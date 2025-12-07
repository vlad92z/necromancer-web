/**
 * HintBox - displays contextual hints to the player
 */

interface HintBoxProps {
  text: string;
}

export function HintBox({ text }: HintBoxProps) {
  return (
    <div className="w-full flex justify-center mb-3">
      <div className="px-4 py-2 border-2 border-white/80 rounded-lg bg-slate-900/60 backdrop-blur-sm">
        <p className="text-white text-sm font-semibold text-center">{text}</p>
      </div>
    </div>
  );
}
