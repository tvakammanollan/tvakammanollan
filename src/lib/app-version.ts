/**
 * Appens version — läst ur `package.json`, aldrig skriven för hand.
 *
 * En hårdkodad siffra i en sida blir gammal utan att någon märker det: den
 * enda som ser den är besökaren, och besökaren vet inte vad som är rätt.
 * Importen går genom Vite (`resolveJsonModule` är på), så värdet bakas in vid
 * bygget och kostar ingenting i drift.
 *
 * Semver, med samma innebörd som i vilket paket som helst: major när något i
 * upplevelsen byts ut i grunden (namnbytet till Tvåkommanollan och den ljusa
 * Lunden-temat är 2.0), minor för nya funktioner, patch för rättningar.
 */
import pkg from "../../package.json";

export const APP_VERSION: string = pkg.version;

/** "v2.0.0" — formen som visas i gränssnittet. */
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
