// Fristående vitest-konfig (läser INTE app:ens vite-config, så Lovable-pluginen
// och Cloudflare-integrationen dras inte in i testkörningar).
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
