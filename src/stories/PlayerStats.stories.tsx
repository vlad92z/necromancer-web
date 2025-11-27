import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlayerStats } from '../features/gameplay/components/PlayerStats';

const meta = {
  title: 'Gameplay/PlayerStats',
  component: PlayerStats,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: 'Ayla',
    isActive: false,
    nameColor: '#8b5cf6',
    health: 28,
    healing: 0,
    essence: 3,
    focus: 2,
    totalPower: 6,
    fireRuneCount: 0,
    hasPenalty: false,
    hasWindMitigation: false,
    windRuneCount: 0,
  },
};

export const ActiveWithPenalty: Story = {
  args: {
    playerName: 'Sable',
    isActive: true,
    nameColor: '#ef4444',
    health: 16,
    healing: 1,
    essence: 4,
    focus: 1,
    totalPower: 4,
    fireRuneCount: 2,
    hasPenalty: true,
    hasWindMitigation: false,
    windRuneCount: 0,
  },
};

export const HighSpellpower: Story = {
  args: {
    playerName: 'Toren',
    isActive: true,
    nameColor: '#06b6d4',
    health: 30,
    healing: 2,
    essence: 8,
    focus: 3,
    totalPower: 24,
    fireRuneCount: 5,
    hasPenalty: false,
    hasWindMitigation: true,
    windRuneCount: 3,
  },
};
