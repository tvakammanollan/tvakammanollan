import { avatarColor, initials } from "@/lib/elo";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  /**
   * Vad färgen räknas ur. **Skicka alltid användarens id.**
   *
   * Färgen ska vara stabil per KONTO, inte per namn. Av tolv anropsställen
   * skickade bara två `seed`; resten föll tillbaka på `name`, så samma person
   * hade en färg i navbaren, en annan i vänlistan och en tredje i forumet —
   * och bytte färg så fort de bytte användarnamn. Bokstäverna kommer alltid
   * ur `name`: resultatsidan skickade en gång in id:t som namn för att få en
   * stabil färg, och brickan visade då **CD** ur `cd3c30d2-…` i stället för
   * personens namn.
   *
   * Valfri bara för att en del forum- och notisrader kan ha en raderad
   * avsändare utan id. Saknas den faller färgen tillbaka på namnet, vilket är
   * bättre än ingen färg alls — men det är reservläget, inte normalfallet.
   */
  seed?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, seed, size = 40, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-on-brand shadow-sm",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(seed || name),
        fontSize: size * 0.4,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials(name)}
    </span>
  );
}
