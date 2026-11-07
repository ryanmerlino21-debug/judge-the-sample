import { createContext } from "react";
// Shared UI contexts (kept separate so charts and extras can both use them without import cycles).
export const NavContext = createContext({ openGlossary: () => {}, goTab: () => {} });
export const PatternContext = createContext(false);

// Brief confirmation messages ("Downloaded ...", "Copied") shown by the Toast component.
export const notify = (message) => window.dispatchEvent(new CustomEvent("jts-toast", { detail: message }));
