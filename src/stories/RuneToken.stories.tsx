/**
 * RuneToken - Storybook stories
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RuneToken } from '../components/RuneToken';

const meta = {
  title: 'Components/RuneToken',
  component: RuneToken,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RuneToken>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
