/**
 * DeckOverlay - Storybook stories
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DeckOverlay } from '../features/gameplay/components/DeckOverlay';

const meta = {
  title: 'Gameplay/DeckOverlay',
  component: DeckOverlay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeckOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
