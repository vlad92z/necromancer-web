/**
 * EndTurnButton - placeholder turn control for the redesigned combat shell.
 */

import { Button } from '../../../components/layout';

export function EndTurnButton() {
  return (
    <div className="absolute bottom-5 right-5">
      <Button
        type="button"
        variant="secondary"
        size="large"
        disabled
        title="End Turn becomes active in a later implementation stage"
        className="min-w-[150px] border-amber-300/40 bg-amber-500/15 text-amber-100"
      >
        End Turn
      </Button>
    </div>
  );
}
