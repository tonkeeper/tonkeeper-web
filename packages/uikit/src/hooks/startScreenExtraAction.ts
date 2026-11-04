import { createContext, ReactNode, useContext } from 'react';

/**
 * An extra way in offered under the start screen's create / import buttons.
 * Only the web shell fills it, with the route back to the origin the wallet
 * moved from.
 *
 * A context rather than a prop because the boot `Loading` screen renders the
 * same column with its content hidden, so that its animated mark lands in
 * exactly the box the start screen draws the static logo in. The column is
 * bottom-anchored: anything the start screen adds below the logo that the
 * loader doesn't would push the mark up at the hand-over. Reading it from the
 * tree keeps both screens on one answer by construction.
 */
export const StartScreenExtraActionContext = createContext<ReactNode>(null);

export const useStartScreenExtraAction = (): ReactNode => useContext(StartScreenExtraActionContext);
