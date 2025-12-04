/**
 * StartGameScreen - Storybook stories
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { StartGameScreen } from '../features/gameplay/components/StartGameScreen';

const meta = {
  title: 'Gameplay/StartGameScreen',
  component: StartGameScreen,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StartGameScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
