/**
 * RuneCell - Storybook stories
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RuneCell } from '../components/RuneCell';

const meta = {
  title: 'Components/RuneCell',
  component: RuneCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RuneCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
