import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Building2, ArrowRight, Briefcase, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';
import { useAllocations } from '@/hooks/useAllocations';
import { useLeadership } from '@/hooks/useLeadership';
import { useCycles } from '@/hooks/useCycles';
import { useClients } from '@/hooks/useClients';
import { supabase } from '@/integrations/supabase/client';
import { coordinations, directorates } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProfileWithAllocation {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  current_coordination_id: string | null;
}

interface GTEntry {
  client_id: string;
  role: string;
}

interface PendingChange {
  coordination_id?: string;
  gts?: GTEntry[];
}

export const AllocationManagement = () => {
  const { cycles, loading: loadingCycles } = useCycles();
  const { clients, gtMembers, isLoading: loadingClients } = useClients();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const { allocations, loading: loadingAllocations, setAllocation, fetchAllocations } = useAllocations(selectedCycleId);
  const [profiles, setProfiles] = useState<ProfileWithAllocation[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const { toast } = useToast();
  const { positions } = useLeadership();

  const leaderUserIds = new Set(positions.map((p) => p.user_id));

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycleId) {
      const currentCycle = cycles.find((c) => c.is_current);
      setSelectedCycleId(currentCycle?.id || cycles[0].id);
    }
  }, [cycles, selectedCycleId]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      fetchAllocations();
      setPendingChanges(new Map());
    }
  }, [selectedCycleId]);

  const fetchProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setProfiles(
        (data || []).map((p) => ({
          ...p,
          current_coordination_id: null,
        }))
      );
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const getInitials = (displayName: string | null, email: string) => {
    if (displayName) {
      return displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const getCoordinationName = (coordId: string | null) => {
    if (!coordId) return 'Não alocado';
    return coordinations.find((c) => c.id === coordId)?.name || coordId;
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Sem GT';
    return clients.find((c) => c.id === clientId)?.name || clientId;
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return '';
    switch (role) {
      case 'director': return 'Diretor';
      case 'manager': return 'Gerente';
      case 'consultant': return 'Consultor';
      default: return role;
    }
  };

  const getUserGTs = (userId: string): GTEntry[] => {
    const pending = pendingChanges.get(userId);
    if (pending?.gts !== undefined) return pending.gts;
    
    return gtMembers
      .filter((m) => m.user_id === userId && m.cycle_id === selectedCycleId)
      .map((m) => ({ client_id: m.client_id, role: m.role }));
  };

  const getUserCoordination = (userId: string): string | null => {
    const pending = pendingChanges.get(userId);
    if (pending?.coordination_id !== undefined) return pending.coordination_id || null;
    const allocation = allocations.find((a) => a.user_id === userId);
    return allocation?.coordination_id || null;
  };

  const getCompletionStatus = (userId: string) => {
    const hasCoordination = !!getUserCoordination(userId);
    const hasGT = getUserGTs(userId).length > 0;
    
    if (hasCoordination && hasGT) return 'complete';
    if (hasCoordination || hasGT) return 'partial';
    return 'none';
  };

  const handleCoordinationChange = (userId: string, coordinationId: string) => {
    const current = pendingChanges.get(userId) || {};
    const newChanges = new Map(pendingChanges);
    newChanges.set(userId, { ...current, coordination_id: coordinationId === '__none__' ? '' : coordinationId });
    setPendingChanges(newChanges);
  };

  const handleAddGT = (userId: string) => {
    const currentGTs = getUserGTs(userId);
    const current = pendingChanges.get(userId) || {};
    const newChanges = new Map(pendingChanges);
    newChanges.set(userId, { ...current, gts: [...currentGTs, { client_id: '', role: 'consultant' }] });
    setPendingChanges(newChanges);
  };

  const handleRemoveGT = (userId: string, index: number) => {
    const currentGTs = getUserGTs(userId);
    const current = pendingChanges.get(userId) || {};
    const newChanges = new Map(pendingChanges);
    const newGTs = currentGTs.filter((_, i) => i !== index);
    newChanges.set(userId, { ...current, gts: newGTs });
    setPendingChanges(newChanges);
  };

  const handleGTClientChange = (userId: string, index: number, clientId: string) => {
    const currentGTs = [...getUserGTs(userId)];
    const current = pendingChanges.get(userId) || {};
    currentGTs[index] = { ...currentGTs[index], client_id: clientId };
    const newChanges = new Map(pendingChanges);
    newChanges.set(userId, { ...current, gts: currentGTs });
    setPendingChanges(newChanges);
  };

  const handleGTRoleChange = (userId: string, index: number, role: string) => {
    const currentGTs = [...getUserGTs(userId)];
    const current = pendingChanges.get(userId) || {};
    currentGTs[index] = { ...currentGTs[index], role };
    const newChanges = new Map(pendingChanges);
    newChanges.set(userId, { ...current, gts: currentGTs });
    setPendingChanges(newChanges);
  };

  const handleSaveAllocation = async (userId: string) => {
    const changes = pendingChanges.get(userId);
    if (!changes || !selectedCycleId) return;
    
    try {
      // Save coordination
      if (changes.coordination_id !== undefined) {
        await setAllocation(userId, selectedCycleId, changes.coordination_id || '');
      }

      // Save GTs - delete all existing and re-insert
      if (changes.gts !== undefined) {
        await supabase
          .from('gt_members')
          .delete()
          .eq('user_id', userId)
          .eq('cycle_id', selectedCycleId);

        const validGTs = changes.gts.filter((gt) => gt.client_id && gt.role);
        if (validGTs.length > 0) {
          const { error } = await supabase
            .from('gt_members')
            .insert(validGTs.map((gt) => ({
              user_id: userId,
              client_id: gt.client_id,
              role: gt.role,
              cycle_id: selectedCycleId,
            })));
          if (error) throw error;
        }
      }

      toast({
        title: 'Alocação salva',
        description: 'A alocação do membro foi atualizada com sucesso.',
      });

      const newChanges = new Map(pendingChanges);
      newChanges.delete(userId);
      setPendingChanges(newChanges);
    } catch (error: any) {
      console.error('Error saving allocation:', error);
      toast({
        title: 'Erro ao salvar alocação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredProfiles = profiles
    .filter((p) => !leaderUserIds.has(p.user_id))
    .filter(
      (p) =>
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const loading = loadingCycles || loadingAllocations || loadingProfiles || loadingClients;

  const coordinationsByDirectorate = directorates.map((dir) => ({
    ...dir,
    coordinations: coordinations.filter((c) => c.directorateId === dir.id),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Gestão de Alocações
            </CardTitle>
            <CardDescription>
              Defina a coordenadoria e os grupos de trabalho de cada membro
            </CardDescription>
          </div>
          {cycles.length > 0 && (
            <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o ciclo" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    <span className="flex items-center gap-2">
                      {cycle.label}
                      {cycle.is_current && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-2 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completo</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Coordenadoria e GT definidos</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Parcial</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Apenas coordenadoria ou GT definido</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !selectedCycleId ? (
          <div className="text-center py-8 text-muted-foreground">
            Selecione um ciclo para gerenciar alocações
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredProfiles.map((profile) => {
                const coordId = getUserCoordination(profile.user_id);
                const userGTs = getUserGTs(profile.user_id);
                const hasChange = pendingChanges.has(profile.user_id);
                const status = getCompletionStatus(profile.user_id);

                return (
                  <motion.div
                    key={profile.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border transition-colors ${
                      hasChange ? 'border-primary bg-primary/5' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(profile.display_name, profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {profile.display_name || profile.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status === 'complete' && (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                        {status === 'partial' && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Parcial
                          </Badge>
                        )}
                        {hasChange && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveAllocation(profile.user_id)}
                            className="gap-1"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Coordination Selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Coordenadoria
                        </label>
                        <Select
                          value={coordId || '__none__'}
                          onValueChange={(v) => handleCoordinationChange(profile.user_id, v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {coordId ? getCoordinationName(coordId) : 'Selecionar...'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">Não alocado</span>
                            </SelectItem>
                            <ScrollArea className="h-[300px]">
                              {coordinationsByDirectorate.map((dir) => (
                                <div key={dir.id}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50">
                                    {dir.name}
                                  </div>
                                  {dir.coordinations.map((coord) => (
                                    <SelectItem key={coord.id} value={coord.id}>
                                      <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: coord.color }} />
                                        {coord.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Multi-GT Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            Grupos de Trabalho ({userGTs.length})
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => handleAddGT(profile.user_id)}
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar GT
                          </Button>
                        </div>

                        {userGTs.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">Nenhum GT atribuído</p>
                        )}

                        {userGTs.map((gt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Select
                              value={gt.client_id || '__none__'}
                              onValueChange={(v) => handleGTClientChange(profile.user_id, idx, v === '__none__' ? '' : v)}
                            >
                              <SelectTrigger className="flex-1 h-8 text-sm">
                                <SelectValue placeholder="Cliente...">
                                  {gt.client_id ? getClientName(gt.client_id) : 'Cliente...'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={gt.role || 'consultant'}
                              onValueChange={(v) => handleGTRoleChange(profile.user_id, idx, v)}
                            >
                              <SelectTrigger className="w-36 h-8 text-sm">
                                <SelectValue>{getRoleLabel(gt.role)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="director">Diretor</SelectItem>
                                <SelectItem value="manager">Gerente</SelectItem>
                                <SelectItem value="consultant">Consultor</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveGT(profile.user_id, idx)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {pendingChanges.size > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-primary">
              {pendingChanges.size} alteração(ões) pendente(s). Clique em "Salvar" ao lado de cada membro para confirmar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};