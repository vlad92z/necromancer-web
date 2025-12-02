/**
 * FieldConfig - renders a labeled setting row with description space for controls.
 */

import type { ReactNode } from 'react';

interface FieldConfigProps {
  label: string;
  description: string;
  children: ReactNode;
}

export function FieldConfig({ label, description, children }: FieldConfigProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-700/20 bg-white/5 px-3 py-3">
      <div className="text-sm font-semibold text-slate-100">{label}</div>
      <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}
