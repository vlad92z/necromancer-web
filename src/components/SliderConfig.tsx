/**
 * SliderConfig - pairs a slider input with descriptive labels and optional value hint copy.
 */

import { FieldConfig } from './FieldConfig';
import type { ChangeEvent, ReactNode } from 'react';

interface SliderConfigProps {
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  valueLabel?: ReactNode;
  ariaLabel?: string;
}

export function SliderConfig({
  label,
  description,
  min,
  max,
  step,
  value,
  onChange,
  valueLabel,
  ariaLabel,
}: SliderConfigProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <FieldConfig label={label} description={description}>
      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={ariaLabel ?? label}
          className="w-full accent-sky-400"
        />
        {valueLabel && <span className="text-xs text-slate-300">{valueLabel}</span>}
      </div>
    </FieldConfig>
  );
}
