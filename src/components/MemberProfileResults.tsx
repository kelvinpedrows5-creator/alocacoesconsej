import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { coordinations, coordinationMatchingProfile } from '@/data/mockData';

interface CoordinationMatch {
  coordinationId: string;
  score: number;
  coordinationName: string;
  color: string;
}

export const MemberProfileResults = () => {
  const { profile } = useAuthContext();

  const hasFilledProfile = profile?.profile_skills || profile?.profile_work_style || 
    profile?.profile_activities || profile?.profile_competencies || 
    profile?.profile_preferred_directorate;

  const calculateMatches = (): CoordinationMatch[] => {
    if (!hasFilledProfile) return [];

    const answers = {
      q1: profile?.profile_skills || '',
      q2: profile?.profile_work_style || '',
      q3: profile?.profile_activities || '',
      q4: profile?.profile_competencies || '',
      q5: profile?.profile_preferred_directorate || '',
    };

    const scores: Record<string, number> = {};

    coordinations.forEach((coord) => {
      scores[coord.id] = 0;
    });

    Object.entries(coordinationMatchingProfile).forEach(([coordId, profileData]) => {
      if (answers['q1'] && profileData.skills.includes(answers['q1'])) {
        scores[coordId] += 25;
      }
      if (answers['q2'] && profileData.workStyle.includes(answers['q2'])) {
        scores[coordId] += 20;
      }
      if (answers['q3'] && profileData.activities.includes(answers['q3'])) {
        scores[coordId] += 25;
      }
      if (answers['q4'] && profileData.competencies.includes(answers['q4'])) {
        scores[coordId] += 20;
      }
      if (answers['q5']) {
        const coordination = coordinations.find((c) => c.id === coordId);
        if (coordination && coordination.directorateId === answers['q5']) {
          scores[coordId] += 10;
        }
      }
    });

    return Object.entries(scores)
      .map(([coordId, score]) => {
        const coord = coordinations.find((c) => c.id === coordId);
        return {
          coordinationId: coordId,
          score,
          coordinationName: coord?.name || '',
          color: coord?.color || '#888',
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  const matches = calculateMatches();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Pesquisa de Perfil
        </CardTitle>
        <CardDescription>
          Coordenadorias que mais combinam com seu perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasFilledProfile ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Perfil não preenchido</p>
              <p className="text-sm text-muted-foreground">
                Acesse "Meu Perfil" e preencha o questionário de alocação para ver suas coordenadorias recomendadas.
              </p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma correspondência encontrada. Tente atualizar suas respostas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, index) => (
              <motion.div
                key={match.coordinationId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: match.color }}
                />
                <div className="flex-1">
                  <p className="font-medium">{match.coordinationName}</p>
                </div>
                <Badge variant={index === 0 ? 'default' : 'secondary'}>
                  {match.score}% match
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
