import { useDotMatrixCanvas } from "./dotMatrixCanvas";

/**
 * Helsidesbakgrund för /login och /signup.
 *
 * Renderar en animerad dot-matrix-shader (amber dots på navy `#fbf6ec`)
 * och lägger innehåll centrerat ovanpå. Reverse-animation triggas via
 * `reverse`-prop när auth-flödet är klart (dots fadar ut från kanterna).
 */
export function AuthLayout({
  children,
  reverse = false,
}: {
  children: React.ReactNode;
  reverse?: boolean;
}) {
  const canvasRef = useDotMatrixCanvas({
    color: [242, 166, 90],
    dotSize: 6,
    totalSize: 20,
    speed: 0.5,
    reverse,
  });

  return (
    <div
      className="relative flex min-h-[calc(100vh-64px)] w-full flex-col text-white"
      style={{ background: "#fbf6ec" }}
    >
      <div className="absolute inset-0 z-0">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(251, 246, 236,0) 0%, rgba(251, 246, 236,0.85) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/3"
          style={{
            background: "linear-gradient(to bottom, rgba(251, 246, 236,1) 0%, rgba(251, 246, 236,0) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
