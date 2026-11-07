import { createContext } from "react";
// Shared UI contexts (kept separate so charts and extras can both use them without import cycles).
export const NavContext = createContext({ openGlossary: () => {}, goTab: () => {} });
export const PatternContext = createContext(false);
