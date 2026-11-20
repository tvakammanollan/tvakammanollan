import { useSyncExternalStore } from "react";
import { isSoundEnabled, setSoundEnabled, subscribeSoundEnabled } from "@/lib/sounds";

/** Ljudets av/på-läge. Servern renderar alltid "på", klienten läser sitt val. */
export function useSoundEnabled(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribeSoundEnabled, isSoundEnabled, () => true);
  return [on, setSoundEnabled];
}
