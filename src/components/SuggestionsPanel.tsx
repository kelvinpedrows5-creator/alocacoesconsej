import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const SuggestionsPanel = () => {
  const { 
    members, 
    coordinations, 
    suggestions, 
    generateSuggestions, 
    applySuggestion,
    applyAllSuggestions 
  } = useAllocationStore();

  const getMember = (id: string) => members.find(m => m.id === id);
  const getCoordination = (id: string) => coordinations.find(c => c.id === id);

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
            <Button variant="outline" onClick={generateSuggestions} className="gap-2">
              {suggestions.length > 0 ? (
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
              <p>Clique em "Gerar Sugestões" para ver recomendações</p>
              <p className="text-sm mt-1">baseadas no histórico de cada membro</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const member = getMember(suggestion.memberId);
                const currentCoord = member ? getCoordination(member.currentCoordinationId || '') : null;
                const suggestedCoord = getCoordination(suggestion.suggestedCoordinationId);
                const priority = priorityConfig[suggestion.priority];
                const PriorityIcon = priority.icon;

                return (
                  <motion.div
                    key={suggestion.memberId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/30 rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-foreground">{member?.name}</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: priority.color, color: priority.color }}
                          >
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            Prioridade {priority.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-2">
                          {currentCoord ? (
                            <Badge 
                              style={{ 
                                backgroundColor: `${currentCoord.color}20`, 
                                color: currentCoord.color 
                              }}
                            >
                              {currentCoord.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Não alocado</Badge>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          {suggestedCoord && (
                            <Badge 
                              style={{ 
                                backgroundColor: `${suggestedCoord.color}20`, 
                                color: suggestedCoord.color 
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
