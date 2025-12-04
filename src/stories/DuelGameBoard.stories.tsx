/**
 * DuelGameBoard - Storybook stories
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DuelGameBoard } from '../features/gameplay/components/DuelGameBoard';

const meta = {
  title: 'Gameplay/DuelGameBoard',
  component: DuelGameBoard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DuelGameBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
