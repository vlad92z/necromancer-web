/**
 * GameBoardFrame - Storybook stories
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { GameBoardFrame } from '../features/gameplay/components/GameBoardFrame';

const meta = {
  title: 'Gameplay/GameBoardFrame',
  component: GameBoardFrame,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GameBoardFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
