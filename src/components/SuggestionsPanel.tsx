import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight, AlertCircle, CheckCircle2, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { coordinations } from '@/data/mockData';
import { useCycles } from '@/hooks/useCycles';
import { useAllocations } from '@/hooks/useAllocations';
import { useLeadership } from '@/hooks/useLeadership';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Suggestion {
  userId: string;
  userName: string;
  currentCoordId: string | null;
  suggestedCoordId: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export const SuggestionsPanel = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [allAllocations, setAllAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [iteration, setIteration] = useState(0);
  const { currentCycle } = useCycles();
  const { allocations: currentAllocations, setAllocation, fetchAllocations } = useAllocations(currentCycle?.id);
  const { positions } = useLeadership();
  const { toast } = useToast();

  const isLeader = (userId: string) => positions.some(p => p.user_id === userId);

  // Fetch all profiles and all historical allocations
  const fetchData = useCallback(async () => {
    const [profilesRes, allocationsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, email, avatar_url'),
      supabase.from('member_allocations').select('user_id, coordination_id, cycle_id'),
    ]);
    setProfiles(profilesRes.data || []);
    setAllAllocations(allocationsRes.data || []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCoordination = (id: string) => coordinations.find(c => c.id === id);

  const generateSuggestions = useCallback(() => {
    if (!currentCycle || profiles.length === 0) return;
    setLoading(true);

    const newIteration = iteration + 1;
    setIteration(newIteration);

    // Build history map: userId -> Set of coordination IDs they've been in
    const historyMap = new Map<string, Set<string>>();
    allAllocations.forEach(a => {
      if (!historyMap.has(a.user_id)) historyMap.set(a.user_id, new Set());
      historyMap.get(a.user_id)!.add(a.coordination_id);
    });

    // Current allocation map
    const currentMap = new Map<string, string>();
    currentAllocations.forEach(a => {
      currentMap.set(a.user_id, a.coordination_id);
    });

    // Count members per coordination in current cycle
    const coordCounts = new Map<string, number>();
    coordinations.forEach(c => coordCounts.set(c.id, 0));
    currentAllocations.forEach(a => {
      coordCounts.set(a.coordination_id, (coordCounts.get(a.coordination_id) || 0) + 1);
    });

    const newSuggestions: Suggestion[] = [];

    // Only suggest for coordinators (exclude directors and managers)
    const coordinatorProfiles = profiles.filter(p => !isLeader(p.user_id));

    coordinatorProfiles.forEach(profile => {
      const visited = historyMap.get(profile.user_id) || new Set<string>();
      const unvisited = coordinations.filter(c => !visited.has(c.id));
      const pool = unvisited.length > 0 ? unvisited : coordinations;

      // Shuffle with iteration-based seed for different results each time
      const shuffled = [...pool].sort(() => {
        return Math.sin(newIteration * 1000 + pool.indexOf(pool[0]) + Math.random()) - 0.5;
      });

      // Sort by member count (less crowded first), with randomness
      shuffled.sort((a, b) => {
        const countA = coordCounts.get(a.id) || 0;
        const countB = coordCounts.get(b.id) || 0;
        // Add randomness factor based on iteration
        const jitter = (Math.sin(newIteration * 100 + a.id.charCodeAt(a.id.length - 1)) * 0.5);
        return (countA - countB) + jitter;
      });

      const currentCoordId = currentMap.get(profile.user_id) || null;
      // Pick a suggestion that's different from current
      const suggested = shuffled.find(c => c.id !== currentCoordId) || shuffled[0];
      
      const visitedCount = visited.size;
      const totalCoords = coordinations.length;
      const coverage = totalCoords > 0 ? (visitedCount / totalCoords) * 100 : 0;

      newSuggestions.push({
        userId: profile.user_id,
        userName: profile.display_name || profile.email.split('@')[0],
        currentCoordId,
        suggestedCoordId: suggested.id,
        reason: coverage < 30
          ? `Baixa cobertura (${visitedCount}/${totalCoords} coordenadorias). Recomendado para experiência 360°.`
          : coverage < 60
          ? `Cobertura média (${visitedCount}/${totalCoords}). Ainda não passou por ${suggested.name}.`
          : `Boa cobertura (${visitedCount}/${totalCoords}). Sugestão: ${suggested.name}.`,
        priority: coverage < 30 ? 'high' : coverage < 60 ? 'medium' : 'low',
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    newSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    setSuggestions(newSuggestions);
    setGenerated(true);
    setLoading(false);
  }, [profiles, allAllocations, currentAllocations, currentCycle, iteration]);

  const applySuggestion = async (suggestion: Suggestion) => {
    if (!currentCycle) return;
    await setAllocation(suggestion.userId, currentCycle.id, suggestion.suggestedCoordId);
    setSuggestions(prev => prev.filter(s => s.userId !== suggestion.userId));
    await fetchData();
  };

  const applyAllSuggestions = async () => {
    if (!currentCycle) return;
    for (const s of suggestions) {
      await setAllocation(s.userId, currentCycle.id, s.suggestedCoordId);
    }
    setSuggestions([]);
    await fetchData();
    toast({ title: 'Todas as sugestões aplicadas', description: 'As alocações foram atualizadas.' });
  };

  const priorityConfig = {
    high: { icon: AlertCircle, color: '#EF4444', label: 'Alta' },
    medium: { icon: Clock, color: '#F59E0B', label: 'Média' },
    low: { icon: CheckCircle2, color: '#10B981', label: 'Baixa' },
  };

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sugestões de Realocação</h2>
              <p className="text-sm text-muted-foreground">
                Baseado no histórico para maximizar a experiência 360°
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={generateSuggestions} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : generated ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Nova Sugestão
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Sugestões
                </>
              )}
            </Button>
            {suggestions.length > 0 && (
              <Button onClick={applyAllSuggestions}>
                <Check className="w-4 h-4 mr-2" />
                Aplicar Todas
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="p-4">
          {suggestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Clique em "{generated ? 'Nova Sugestão' : 'Gerar Sugestões'}" para ver recomendações</p>
              <p className="text-sm mt-1">baseadas no histórico de cada membro</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const currentCoord = suggestion.currentCoordId ? getCoordination(suggestion.currentCoordId) : null;
                const suggestedCoord = getCoordination(suggestion.suggestedCoordId);
                const priority = priorityConfig[suggestion.priority];
                const PriorityIcon = priority.icon;

                return (
                  <motion.div
                    key={suggestion.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/30 rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">{suggestion.userName}</span>
                          <Badge
                            variant="outline"
                            className="text-xs shrink-0"
                            style={{ borderColor: priority.color, color: priority.color }}
                          >
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            Prioridade {priority.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-2 flex-wrap">
                          {currentCoord ? (
                            <Badge
                              style={{
                                backgroundColor: `${currentCoord.color}20`,
                                color: currentCoord.color,
                              }}
                            >
                              {currentCoord.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Não alocado</Badge>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          {suggestedCoord && (
                            <Badge
                              style={{
                                backgroundColor: `${suggestedCoord.color}20`,
                                color: suggestedCoord.color,
                              }}
                            >
                              {suggestedCoord.name}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion(suggestion)}
                        className="shrink-0"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
