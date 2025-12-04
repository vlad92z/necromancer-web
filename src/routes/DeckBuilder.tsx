/**
 * DeckBuilder - Future feature: Pre-match deck drafting interface
 * Currently inaccessible stub
 */

import { viewMessageClasses, viewPanelClasses, viewShellClasses, viewTitleClasses } from '../styles/uiClasses';

export function DeckBuilder() {
  return (
    <main className={viewShellClasses}>
      <section className={viewPanelClasses}>
        <h1 className={viewTitleClasses}>Deck Builder</h1>
        <p className={viewMessageClasses}>Coming Soon: Customize your rune deck before battle</p>
      </section>
    </main>
  );
}
