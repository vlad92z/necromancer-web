/**
 * SoloGameOverModal stories - highlights the end-of-run summary
 */

import type { Meta, StoryObj } from '@storybook/react';

import { initializeSoloGame } from '../../../utils/gameInitialization';
import { SoloGameOverModal } from './SoloGameOverModal';

const modalPlayer = initializeSoloGame(4).players[0];

const meta: Meta<typeof SoloGameOverModal> = {
  title: 'Solo Game/Game Over Modal',
  component: SoloGameOverModal,
};

export default meta;

type Story = StoryObj<typeof SoloGameOverModal>;

export const Victory: Story = {
  args: {
    player: modalPlayer,
    outcome: 'victory',
    runePowerTotal: 220,
    round: 6,
    targetScore: 200,
  },
};

export const Defeat: Story = {
  args: {
    player: modalPlayer,
    outcome: 'defeat',
    runePowerTotal: 140,
    round: 5,
    targetScore: 200,
  },
};
