import { motion } from 'framer-motion';
import { PartyPopper, Cake, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CelebrationBannerProps {
  joinedAt: string | null | undefined;
  displayName?: string | null;
}

type Milestone = {
  type: 'six-months' | 'anniversary';
  years?: number;
  title: string;
  message: string;
  icon: typeof PartyPopper;
};

/**
 * Returns a milestone if today is within the same week of:
 * - the 6-month mark since joining (one-time)
 * - any yearly anniversary of joining (recurring)
 */
function detectMilestone(joinedAt: string): Milestone | null {
  const joined = new Date(joinedAt + 'T00:00:00');
  if (isNaN(joined.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msInDay = 1000 * 60 * 60 * 24;

  // Anniversary check (yearly): same month/day, at least 1 year passed
  const yearsSinceJoin = today.getFullYear() - joined.getFullYear();
  if (yearsSinceJoin >= 1) {
    const annivThisYear = new Date(today.getFullYear(), joined.getMonth(), joined.getDate());
    const diffDays = Math.floor((today.getTime() - annivThisYear.getTime()) / msInDay);
    if (diffDays >= 0 && diffDays <= 6) {
      return {
        type: 'anniversary',
        years: yearsSinceJoin,
        title: `Parabéns por ${yearsSinceJoin} ${yearsSinceJoin === 1 ? 'ano' : 'anos'} de CONSEJ! 🎉`,
        message: `Sua jornada continua impactando a CONSEJ. Obrigado por fazer parte dessa história!`,
        icon: Cake,
      };
    }
  }

  // 6-month milestone (one-time, only in the year of joining + 0 years)
  const sixMonths = new Date(joined);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const diffSix = Math.floor((today.getTime() - sixMonths.getTime()) / msInDay);
  if (diffSix >= 0 && diffSix <= 6 && yearsSinceJoin < 1) {
    return {
      type: 'six-months',
      title: 'Parabéns pelos 6 meses de CONSEJ! 🌱',
      message: 'Meio ano de aprendizados, conexões e conquistas. Que venham muitos mais!',
      icon: Sparkles,
    };
  }

  return null;
}

export function CelebrationBanner({ joinedAt, displayName }: CelebrationBannerProps) {
  if (!joinedAt) return null;
  const milestone = detectMilestone(joinedAt);
  if (!milestone) return null;

  const Icon = milestone.icon;
  const firstName = displayName?.split(' ')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/30 blur-3xl" />
        </div>
        <CardContent className="relative py-5 flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <PartyPopper className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">
                {firstName ? `${firstName}, ` : ''}{milestone.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{milestone.message}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
