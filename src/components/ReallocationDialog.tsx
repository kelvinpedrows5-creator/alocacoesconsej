import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Sparkles, Users, ChevronRight, Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { toast } from '@/hooks/use-toast';

interface PendingAllocation {
  memberId: string;
  coordinationId: string;
}

export const ReallocationDialog = () => {
  const [open, setOpen] = useState(false);
  const [pendingAllocations, setPendingAllocations] = useState<PendingAllocation[]>([]);
  const {
    members,
    coordinations,
    suggestions,
    generateSuggestions,
    applySuggestion,
    applyAllSuggestions,
    updateMember,
    selectedQuarter,
  } = useAllocationStore();

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getCoordination = (id: string) => coordinations.find((c) => c.id === id);

  const handleManualAllocation = (memberId: string, coordinationId: string) => {
    setPendingAllocations((prev) => {
      const existing = prev.findIndex((p) => p.memberId === memberId);
      if (existing >= 0) {
        if (coordinationId === '__keep__') {
          return prev.filter((p) => p.memberId !== memberId);
        }
        const updated = [...prev];
        updated[existing] = { memberId, coordinationId };
        return updated;
      }
      if (coordinationId === '__keep__') return prev;
      return [...prev, { memberId, coordinationId }];
    });
  };

  const getPendingAllocation = (memberId: string) => {
    return pendingAllocations.find((p) => p.memberId === memberId)?.coordinationId;
  };

  const applyManualAllocations = () => {
    pendingAllocations.forEach(({ memberId, coordinationId }) => {
      const member = getMember(memberId);
      if (member) {
        updateMember(memberId, {
          currentCoordinationId: coordinationId,
          history: [
            ...member.history.map((h) =>
              !h.endDate ? { ...h, endDate: new Date().toISOString().split('T')[0] } : h
            ),
            {
              coordinationId,
              quarter: selectedQuarter,
              startDate: new Date().toISOString().split('T')[0],
            },
          ],
        });
      }
    });
    setPendingAllocations([]);
    toast({
      title: 'Realocações aplicadas!',
      description: `${pendingAllocations.length} membro(s) realocado(s) com sucesso.`,
    });
    setOpen(false);
  };

  const handleApplyAllSuggestions = () => {
    applyAllSuggestions();
    toast({
      title: 'Sugestões aplicadas!',
      description: 'Todos os membros foram realocados conforme sugestão.',
    });
    setOpen(false);
  };

  const priorityConfig = {
    high: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Alta' },
    medium: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Média' },
    low: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Baixa' },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Shuffle className="w-4 h-4" />
          Realocar Membros
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shuffle className="w-5 h-5 text-primary" />
            Realocação de Membros
          </DialogTitle>
          <DialogDescription>
            Gerencie a realocação trimestral dos membros entre coordenadorias.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="auto" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Sugestão Automática
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Users className="w-4 h-4" />
              Alocação Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="flex-1 flex flex-col mt-4 min-h-0 data-[state=inactive]:hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                O sistema analisa o histórico e sugere realocações para maximizar a experiência 360°.
              </p>
              <Button variant="outline" size="sm" onClick={generateSuggestions} className="gap-2 flex-shrink-0 ml-4">
                <Sparkles className="w-4 h-4" />
                Gerar Sugestões
              </Button>
            </div>

            <ScrollArea className="h-[350px]">
              <div className="pr-4">
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Clique em "Gerar Sugestões" para obter recomendações de realocação.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => {
                    const member = getMember(suggestion.memberId);
                    const currentCoord = member?.currentCoordinationId
                      ? getCoordination(member.currentCoordinationId)
                      : null;
                    const suggestedCoord = getCoordination(suggestion.suggestedCoordinationId);
                    const priority = priorityConfig[suggestion.priority];

                    return (
                      <motion.div
                        key={suggestion.memberId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member?.avatar} />
                              <AvatarFallback>
                                {member?.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member?.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="truncate">{currentCoord?.name || 'Sem alocação'}</span>
                                <ArrowRight className="w-4 h-4 flex-shrink-0 text-primary" />
                                <span className="truncate font-medium text-foreground">
                                  {suggestedCoord?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={priority.color}>
                            {priority.label}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{suggestion.reason}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              </div>
            </ScrollArea>

            {suggestions.length > 0 && (
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApplyAllSuggestions} className="gap-2">
                  <Check className="w-4 h-4" />
                  Aplicar Todas ({suggestions.length})
                </Button>
              </DialogFooter>
            )}
          </TabsContent>

          <TabsContent value="manual" className="flex-1 flex flex-col mt-4 min-h-0 data-[state=inactive]:hidden">
            <p className="text-sm text-muted-foreground mb-4 flex-shrink-0">
              Selecione manualmente a nova coordenadoria para cada membro.
            </p>

            <ScrollArea className="h-[350px]">
              <div className="space-y-3 pr-4">
                {members.map((member, index) => {
                  const currentCoord = member.currentCoordinationId
                    ? getCoordination(member.currentCoordinationId)
                    : null;
                  const pendingCoordId = getPendingAllocation(member.id);
                  const pendingCoord = pendingCoordId ? getCoordination(pendingCoordId) : null;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border transition-colors ${
                        pendingCoordId ? 'bg-primary/5 border-primary/30' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Atual: {currentCoord?.name || 'Sem alocação'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {pendingCoord && (
                            <div className="flex items-center gap-2 text-sm">
                              <ArrowRight className="w-4 h-4 text-primary" />
                              <span className="font-medium text-primary">{pendingCoord.name}</span>
                            </div>
                          )}
                          <Select
                            value={pendingCoordId || '__keep__'}
                            onValueChange={(value) => handleManualAllocation(member.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Nova coordenadoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__keep__">Manter atual</SelectItem>
                              {coordinations
                                .filter((c) => c.id !== member.currentCoordinationId)
                                .map((coord) => (
                                  <SelectItem key={coord.id} value={coord.id}>
                                    {coord.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mr-auto">
                {pendingAllocations.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {pendingAllocations.length} alteração(ões) pendente(s)
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={applyManualAllocations}
                disabled={pendingAllocations.length === 0}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Aplicar Alterações
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
