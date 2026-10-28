/**
 * Helsidesyta för /login, /signup och /onboarding: innehållet centrerat på
 * papperet. Tidigare låg en animerad dot-matrix-canvas bakom formuläret.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full flex-col bg-background text-white">
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
