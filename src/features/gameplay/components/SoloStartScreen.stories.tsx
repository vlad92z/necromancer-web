/**
 * SoloStartScreen stories - solo run setup flows
 */

import type { Meta, StoryObj } from '@storybook/react';

import { SoloStartScreen } from './SoloStartScreen';
import type { RuneTypeCount, SoloRunConfig } from '../../../types/game';

const meta: Meta<typeof SoloStartScreen> = {
  title: 'Solo Game/Start Screen',
  component: SoloStartScreen,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof SoloStartScreen>;

const handleStartSolo = (runeTypeCount: RuneTypeCount, config: SoloRunConfig) => {
  console.log('Start solo run', runeTypeCount, config);
};

export const NewRun: Story = {
  args: {
    canContinue: false,
    onStartSolo: handleStartSolo,
    bestRound: 0,
  },
};

export const ContinueExisting: Story = {
  args: {
    canContinue: true,
    onContinueSolo: () => console.log('Continue solo run'),
    onStartSolo: handleStartSolo,
    bestRound: 7,
  },
};
