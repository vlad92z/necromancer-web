import { RuneType } from '../App';
import { Flame, Droplet, Mountain, Wind, Sparkles } from 'lucide-react';

interface RuneTokenProps {
  type: RuneType;
  size?: 'xs' | 'sm' | 'md';
}

export function RuneToken({ type, size = 'md' }: RuneTokenProps) {
  const sizeClasses = {
    xs: 'w-[2em] h-[2em]',
    sm: 'w-[2.5em] h-[2.5em]',
    md: 'w-[3em] h-[3em]'
  };

  const iconSizes = {
    xs: 'w-[1em] h-[1em]',
    sm: 'w-[1.25em] h-[1.25em]',
    md: 'w-[1.5em] h-[1.5em]'
  };

  const configs = {
    fire: {
      bg: 'bg-gradient-to-br from-orange-500 to-red-600',
      border: 'border-orange-400',
      icon: Flame,
      color: 'text-orange-100'
    },
    water: {
      bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      border: 'border-blue-400',
      icon: Droplet,
      color: 'text-blue-100'
    },
    earth: {
      bg: 'bg-gradient-to-br from-green-700 to-emerald-800',
      border: 'border-green-500',
      icon: Mountain,
      color: 'text-green-100'
    },
    air: {
      bg: 'bg-gradient-to-br from-sky-400 to-indigo-500',
      border: 'border-sky-300',
      icon: Wind,
      color: 'text-sky-100'
    },
    arcane: {
      bg: 'bg-gradient-to-br from-purple-600 to-fuchsia-700',
      border: 'border-purple-400',
      icon: Sparkles,
      color: 'text-purple-100'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`${sizeClasses[size]} ${config.bg} ${config.border} border-2 rounded-lg shadow-lg flex items-center justify-center`}>
      <Icon className={`${iconSizes[size]} ${config.color}`} />
    </div>
  );
}