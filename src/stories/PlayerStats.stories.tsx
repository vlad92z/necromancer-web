import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlayerStats } from '../features/gameplay/components/Player/PlayerStats';

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
    round: 1,
  },
};

export const ActiveWithPenalty: Story = {
  args: {
    playerName: 'Sable',
    isActive: true,
    nameColor: '#ef4444',
    health: 16,
    healing: 1,
    round: 1,
  },
};

export const HighSpellpower: Story = {
  args: {
    playerName: 'Toren',
    isActive: true,
    nameColor: '#06b6d4',
    health: 30,
    healing: 2,
    round: 1,
  },
};
