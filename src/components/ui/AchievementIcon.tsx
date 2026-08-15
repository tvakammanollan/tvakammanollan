import {
  Swords,
  PartyPopper,
  Shield,
  Flame,
  Handshake,
  BookOpen,
  Library,
  Brain,
  GraduationCap,
  Crown,
  Target,
  Medal,
  Trophy,
  Sparkles,
  Award,
  Gem,
  Rocket,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ikoner per utmärkelse. Ligger i UI-lagret, inte i `lib/achievements.ts`, så
 * att definitionsmodulen förblir ren data och kan köras server-side.
 *
 * Tidigare var ikonerna emoji i datamodellen — de renderas olika på varje
 * plattform, kan inte färgsättas per tier, och en av dem var dessutom ett
 * typografiskt "✦" mitt bland emoji.
 *
 * Nycklarna måste matcha `id` i ACHIEVEMENTS (`src/lib/achievements.ts`);
 * en okänd id faller tillbaka på Award i stället för att krascha.
 */
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  first_match: Swords,
  first_win: PartyPopper,
  ten_matches: Shield,
  streak_3: Flame,
  first_friend: Handshake,
  words_100: BookOpen,
  words_500: Library,
  words_1000: Brain,
  words_2500: GraduationCap,
  words_10000: Crown,
  perfect_match: Target,
  ten_wins: Medal,
  elo_1200: Trophy,
  streak_7: Sparkles,
  fifty_matches: Award,
  elo_1400: Gem,
  elo_1600: Rocket,
  streak_30: CalendarCheck,
};

function achievementIconFor(id: string): LucideIcon {
  return ACHIEVEMENT_ICONS[id] ?? Award;
}

export function AchievementIcon({
  id,
  className,
  style,
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = achievementIconFor(id);
  return <Icon className={cn("h-5 w-5 shrink-0", className)} style={style} aria-hidden />;
}
