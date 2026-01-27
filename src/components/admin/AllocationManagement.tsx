import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Building2, ArrowRight } from 'lucide-react';
import { useAllocations, AllocationWithProfile } from '@/hooks/useAllocations';
import { useCycles, AllocationCycle } from '@/hooks/useCycles';
import { supabase } from '@/integrations/supabase/client';
import { coordinations, directorates } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export const AllocationManagement = () => {
  const { cycles, loading: loadingCycles } = useCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const { allocations, loading: loadingAllocations, setAllocation, fetchAllocations } = useAllocations(selectedCycleId);
  const [profiles, setProfiles] = useState<ProfileWithAllocation[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(new Map());

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

  const getDirectorateName = (coordId: string | null) => {
    if (!coordId) return '';
    const coord = coordinations.find((c) => c.id === coordId);
    if (!coord) return '';
    return directorates.find((d) => d.id === coord.directorateId)?.name || '';
  };

  const getAllocationForUser = (userId: string) => {
    // Check pending changes first
    if (pendingChanges.has(userId)) {
      return pendingChanges.get(userId);
    }
    // Then check saved allocations
    const allocation = allocations.find((a) => a.user_id === userId);
    return allocation?.coordination_id || null;
  };

  const handleCoordinationChange = (userId: string, coordinationId: string) => {
    const newChanges = new Map(pendingChanges);
    const currentAllocation = allocations.find((a) => a.user_id === userId);
    
    // If setting back to original value, remove from pending
    if (currentAllocation?.coordination_id === coordinationId) {
      newChanges.delete(userId);
    } else {
      newChanges.set(userId, coordinationId);
    }
    
    setPendingChanges(newChanges);
  };

  const handleSaveAllocation = async (userId: string) => {
    const newCoordId = pendingChanges.get(userId);
    if (!newCoordId || !selectedCycleId) return;
    
    await setAllocation(userId, selectedCycleId, newCoordId);
    
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

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
  const loading = loadingCycles || loadingAllocations || loadingProfiles;

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
              Defina a coordenadoria de cada membro por ciclo
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
                const currentCoordId = getAllocationForUser(profile.user_id);
                const hasChange = pendingChanges.has(profile.user_id);

                return (
                  <motion.div
                    key={profile.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      hasChange ? 'border-primary bg-primary/5' : 'bg-card'
                    }`}
                  >
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

                    <div className="flex items-center gap-3">
                      <Select
                        value={currentCoordId || '__none__'}
                        onValueChange={(v) => handleCoordinationChange(profile.user_id, v)}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue>
                            {currentCoordId ? (
                              <span className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {getCoordinationName(currentCoordId)}
                              </span>
                            ) : (
                              'Selecionar coordenadoria'
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
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
