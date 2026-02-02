import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Sparkles, Users, Check, ArrowRight, Building2, Briefcase, AlertCircle } from 'lucide-react';
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
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useAllocations } from '@/hooks/useAllocations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { coordinations as mockCoordinations } from '@/data/mockData';
import { useQuery } from '@tanstack/react-query';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface PendingAllocation {
  userId: string;
  coordinationId: string | null;
  gtClientId: string | null;
  gtRole: string | null;
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
  } = useAllocationStore();

  const { clients, gtMembers } = useClients();
  const { currentCycle } = useCycles();
  const { allocations, setAllocation: saveAllocation } = useAllocations(currentCycle?.id);

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_reallocation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getCoordination = (id: string) => coordinations.find((c) => c.id === id) || mockCoordinations.find((c) => c.id === id);
  
  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  const getCurrentAllocation = (userId: string) => {
    return allocations.find(a => a.user_id === userId);
  };

  const getCurrentGT = (userId: string) => {
    if (!currentCycle) return null;
    return gtMembers.find(m => m.user_id === userId && m.cycle_id === currentCycle.id);
  };

  const handleAllocationChange = (userId: string, field: 'coordinationId' | 'gtClientId' | 'gtRole', value: string | null) => {
    setPendingAllocations(prev => {
      const existingIndex = prev.findIndex(p => p.userId === userId);
      const currentAllocation = getCurrentAllocation(userId);
      const currentGT = getCurrentGT(userId);
      
      const baseAlloc: PendingAllocation = {
        userId,
        coordinationId: currentAllocation?.coordination_id || null,
        gtClientId: currentGT?.client_id || null,
        gtRole: currentGT?.role || null,
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], [field]: value === '__none__' ? null : value };
        return updated;
      }

      return [...prev, { ...baseAlloc, [field]: value === '__none__' ? null : value }];
    });
  };

  const getPendingAllocation = (userId: string) => {
    return pendingAllocations.find(p => p.userId === userId);
  };

  const hasChanges = (userId: string) => {
    const pending = getPendingAllocation(userId);
    if (!pending) return false;
    
    const currentAlloc = getCurrentAllocation(userId);
    const currentGT = getCurrentGT(userId);
    
    return (
      pending.coordinationId !== (currentAlloc?.coordination_id || null) ||
      pending.gtClientId !== (currentGT?.client_id || null) ||
      pending.gtRole !== (currentGT?.role || null)
    );
  };

  const getAllocationStatus = (userId: string) => {
    const pending = getPendingAllocation(userId);
    const currentAlloc = getCurrentAllocation(userId);
    const currentGT = getCurrentGT(userId);
    
    const coordId = pending?.coordinationId ?? currentAlloc?.coordination_id;
    const gtId = pending?.gtClientId ?? currentGT?.client_id;
    
    if (coordId && gtId) return 'complete';
    if (coordId || gtId) return 'partial';
    return 'none';
  };

  const applyManualAllocations = async () => {
    if (!currentCycle) {
      toast({
        title: 'Erro',
        description: 'Nenhum ciclo selecionado.',
        variant: 'destructive',
      });
      return;
    }

    const changedAllocations = pendingAllocations.filter(p => {
      const currentAlloc = getCurrentAllocation(p.userId);
      const currentGT = getCurrentGT(p.userId);
      
      return (
        p.coordinationId !== (currentAlloc?.coordination_id || null) ||
        p.gtClientId !== (currentGT?.client_id || null) ||
        p.gtRole !== (currentGT?.role || null)
      );
    });

    for (const alloc of changedAllocations) {
      // Update coordination allocation
      if (alloc.coordinationId) {
        await saveAllocation(
          alloc.userId,
          currentCycle.id,
          alloc.coordinationId,
          alloc.gtClientId || undefined,
          alloc.gtRole || undefined
        );
      }

      // Update GT membership if changed
      if (alloc.gtClientId && alloc.gtRole) {
        const existingGT = getCurrentGT(alloc.userId);
        
        if (existingGT) {
          // Remove old GT membership
          await supabase.from('gt_members').delete().eq('id', existingGT.id);
        }
        
        // Add new GT membership
        await supabase.from('gt_members').insert({
          user_id: alloc.userId,
          client_id: alloc.gtClientId,
          role: alloc.gtRole,
          cycle_id: currentCycle.id,
        });
      }
    }

    setPendingAllocations([]);
    toast({
      title: 'Realocações aplicadas!',
      description: `${changedAllocations.length} membro(s) realocado(s) com sucesso.`,
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

  const changesCount = pendingAllocations.filter(p => hasChanges(p.userId)).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90" size="sm">
          <Shuffle className="w-4 h-4" />
          <span className="hidden sm:inline">Realocar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shuffle className="w-5 h-5 text-primary" />
            Realocação de Membros
          </DialogTitle>
          <DialogDescription>
            Gerencie a alocação dos membros em coordenadorias e grupos de trabalho.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Sugestão Automática</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Alocação Manual</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="flex-1 flex flex-col mt-4 min-h-0 data-[state=inactive]:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                O sistema analisa o histórico e sugere realocações para maximizar a experiência 360°.
              </p>
              <Button variant="outline" size="sm" onClick={generateSuggestions} className="gap-2 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
                Gerar Sugestões
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-[300px]">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={member?.avatar} />
                              <AvatarFallback>
                                {member?.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member?.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <span className="truncate max-w-[100px]">{currentCoord?.name || 'Sem alocação'}</span>
                                <ArrowRight className="w-4 h-4 flex-shrink-0 text-primary" />
                                <span className="truncate max-w-[100px] font-medium text-foreground">
                                  {suggestedCoord?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
              <DialogFooter className="mt-4 pt-4 border-t flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleApplyAllSuggestions} className="gap-2 w-full sm:w-auto">
                  <Check className="w-4 h-4" />
                  Aplicar Todas ({suggestions.length})
                </Button>
              </DialogFooter>
            )}
          </TabsContent>

          <TabsContent value="manual" className="flex-1 flex flex-col mt-4 min-h-0 data-[state=inactive]:hidden">
            <p className="text-sm text-muted-foreground mb-4 flex-shrink-0">
              Selecione a coordenadoria e/ou grupo de trabalho para cada membro.
            </p>

            <ScrollArea className="flex-1 min-h-[300px]">
              <div className="space-y-3 pr-4">
                {profiles.map((profile, index) => {
                  const currentAlloc = getCurrentAllocation(profile.user_id);
                  const currentGT = getCurrentGT(profile.user_id);
                  const pending = getPendingAllocation(profile.user_id);
                  const status = getAllocationStatus(profile.user_id);
                  const changed = hasChanges(profile.user_id);

                  const displayCoordId = pending?.coordinationId ?? currentAlloc?.coordination_id ?? '';
                  const displayGtClientId = pending?.gtClientId ?? currentGT?.client_id ?? '';
                  const displayGtRole = pending?.gtRole ?? currentGT?.role ?? '';

                  const currentCoord = displayCoordId ? getCoordination(displayCoordId) : null;
                  const currentClient = displayGtClientId ? clients.find(c => c.id === displayGtClientId) : null;

                  return (
                    <motion.div
                      key={profile.user_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border transition-colors ${
                        changed ? 'bg-primary/5 border-primary/30' : 'bg-card'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        {/* Header with avatar and name */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(profile.display_name, profile.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{profile.display_name || profile.email}</p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={status === 'complete' ? 'default' : status === 'partial' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {status === 'complete' ? 'Completo' : status === 'partial' ? 'Parcial' : 'Pendente'}
                              </Badge>
                              {status === 'partial' && (
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Allocation selects */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Coordination */}
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Coordenadoria
                            </label>
                            <Select
                              value={displayCoordId || '__none__'}
                              onValueChange={(value) => handleAllocationChange(profile.user_id, 'coordinationId', value)}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Nenhuma</SelectItem>
                                {mockCoordinations.map((coord) => (
                                  <SelectItem key={coord.id} value={coord.id}>
                                    <span className="truncate">{coord.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* GT Client */}
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              Grupo de Trabalho
                            </label>
                            <Select
                              value={displayGtClientId || '__none__'}
                              onValueChange={(value) => handleAllocationChange(profile.user_id, 'gtClientId', value)}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Nenhum</SelectItem>
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    <span className="truncate">{client.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* GT Role */}
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Função no GT</label>
                            <Select
                              value={displayGtRole || '__none__'}
                              onValueChange={(value) => handleAllocationChange(profile.user_id, 'gtRole', value)}
                              disabled={!displayGtClientId}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Nenhuma</SelectItem>
                                <SelectItem value="director">Diretor de Demandas</SelectItem>
                                <SelectItem value="manager">Gerente de Demandas</SelectItem>
                                <SelectItem value="consultant">Consultor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4 pt-4 border-t flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 sm:mr-auto w-full sm:w-auto justify-center sm:justify-start">
                {changesCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {changesCount} alteração(ões) pendente(s)
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                onClick={applyManualAllocations}
                disabled={changesCount === 0}
                className="gap-2 w-full sm:w-auto"
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
