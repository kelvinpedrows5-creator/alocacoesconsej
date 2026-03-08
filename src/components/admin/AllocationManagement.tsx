import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Building2, ArrowRight, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAllocations } from '@/hooks/useAllocations';
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

interface PendingChange {
  coordination_id?: string;
  gt_client_id?: string;
  gt_role?: string;
}

export const AllocationManagement = () => {
  const { cycles, loading: loadingCycles } = useCycles();
  const { clients, isLoading: loadingClients } = useClients();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const { allocations, loading: loadingAllocations, setAllocation, fetchAllocations } = useAllocations(selectedCycleId);
  const [profiles, setProfiles] = useState<ProfileWithAllocation[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());

  // Set initial cycle when cycles load
  useEffect(() => {
    if (cycles.length > 0 && !selectedCycleId) {
      const currentCycle = cycles.find((c) => c.is_current);
      setSelectedCycleId(currentCycle?.id || cycles[0].id);
    }
  }, [cycles, selectedCycleId]);

  // Fetch profiles
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Refetch allocations when cycle changes
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
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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

  const getAllocationForUser = (userId: string) => {
    const allocation = allocations.find((a) => a.user_id === userId);
    const pending = pendingChanges.get(userId);
    
    return {
      coordination_id: pending?.coordination_id !== undefined 
        ? pending.coordination_id 
        : (allocation?.coordination_id || null),
      gt_client_id: pending?.gt_client_id !== undefined 
        ? pending.gt_client_id 
        : ((allocation as any)?.gt_client_id || null),
      gt_role: pending?.gt_role !== undefined 
        ? pending.gt_role 
        : ((allocation as any)?.gt_role || null),
    };
  };

  const getCompletionStatus = (userId: string) => {
    const alloc = getAllocationForUser(userId);
    const hasCoordination = !!alloc.coordination_id;
    const hasGT = !!alloc.gt_client_id && !!alloc.gt_role;
    
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

  const handleGTChange = (userId: string, clientId: string) => {
    const current = pendingChanges.get(userId) || {};
    const newChanges = new Map(pendingChanges);
    newChanges.set(userId, { 
      ...current, 
      gt_client_id: clientId === '__none__' ? '' : clientId,
      gt_role: clientId === '__none__' ? '' : (current.gt_role || 'consultant'),
    });
    setPendingChanges(newChanges);
  };

  const handleGTRoleChange = (userId: string, role: string) => {
    const current = pendingChanges.get(userId) || {};
    const newChanges = new Map(pendingChanges);
    newChanges.set(userId, { ...current, gt_role: role });
    setPendingChanges(newChanges);
  };

  const handleSaveAllocation = async (userId: string) => {
    const changes = pendingChanges.get(userId);
    if (!changes || !selectedCycleId) return;
    
    await setAllocation(
      userId, 
      selectedCycleId, 
      changes.coordination_id || '', 
      changes.gt_client_id || undefined, 
      changes.gt_role || undefined
    );
    
    // Remove from pending changes after save
    const newChanges = new Map(pendingChanges);
    newChanges.delete(userId);
    setPendingChanges(newChanges);
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const loading = loadingCycles || loadingAllocations || loadingProfiles || loadingClients;

  // Group coordinations by directorate
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
              Defina a coordenadoria e o grupo de trabalho de cada membro
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
                        <Badge variant="secondary" className="text-xs">
                          Atual
                        </Badge>
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
                const alloc = getAllocationForUser(profile.user_id);
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Coordination Selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Coordenadoria
                        </label>
                        <Select
                          value={alloc.coordination_id || '__none__'}
                          onValueChange={(v) => handleCoordinationChange(profile.user_id, v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {alloc.coordination_id 
                                ? getCoordinationName(alloc.coordination_id)
                                : 'Selecionar...'
                              }
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
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: coord.color }}
                                        />
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

                      {/* GT Selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          Grupo de Trabalho
                        </label>
                        <Select
                          value={alloc.gt_client_id || '__none__'}
                          onValueChange={(v) => handleGTChange(profile.user_id, v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {alloc.gt_client_id 
                                ? getClientName(alloc.gt_client_id)
                                : 'Selecionar...'
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">Sem GT</span>
                            </SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* GT Role Selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Função no GT
                        </label>
                        <Select
                          value={alloc.gt_role || 'consultant'}
                          onValueChange={(v) => handleGTRoleChange(profile.user_id, v)}
                          disabled={!alloc.gt_client_id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {alloc.gt_role 
                                ? getRoleLabel(alloc.gt_role) 
                                : 'Selecionar...'
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="director">Diretor de Demandas</SelectItem>
                            <SelectItem value="manager">Gerente de Demandas</SelectItem>
                            <SelectItem value="consultant">Consultor</SelectItem>
                          </SelectContent>
                        </Select>
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
