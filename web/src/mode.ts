import { createContext } from "react";
/** "live" when the local fork answers, "static" for the replay of results/ (live-only buttons are hidden). */
export const ModeCtx = createContext<"live" | "static">("static");
