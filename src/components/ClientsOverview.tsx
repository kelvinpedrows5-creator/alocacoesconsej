import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, ClipboardCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientStatusLight } from '@/components/ClientStatusLight';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface DemandCount {
  gt_client_id: string;
  count: number;
}

export function ClientsOverview() {
  const { clients, gtMembers, getGTMembersByClient, getClientsByCycle } = useClients();
  const { cycles, currentCycle } = useCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_clients_view'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url');
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch executed demand counts per client
  const { data: demandCounts = [] } = useQuery({
    queryKey: ['demand_counts_by_client'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demand_submissions')
        .select('gt_client_id')
        .eq('status', 'evaluated')
        .not('gt_client_id', 'is', null);
      if (error) throw error;
      
      // Count per client
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => {
        if (d.gt_client_id) {
          counts[d.gt_client_id] = (counts[d.gt_client_id] || 0) + 1;
        }
      });
      return Object.entries(counts).map(([gt_client_id, count]) => ({ gt_client_id, count }));
    },
  });

  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId);

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Diretor';
      case 'manager': return 'Gerente';
      case 'consultant': return 'Consultor';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'director': return 'text-purple-700 bg-purple-100 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700';
      case 'manager': return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      case 'consultant': return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700';
      default: return '';
    }
  };

  const getDemandCount = (clientId: string) => {
    return demandCounts.find(d => d.gt_client_id === clientId)?.count || 0;
  };

  useEffect(() => {
    if (currentCycle && !selectedCycleId) {
      setSelectedCycleId(currentCycle.id);
    }
  }, [currentCycle, selectedCycleId]);

  const activeCycleId = selectedCycleId || currentCycle?.id || '';
  const displayClients = activeCycleId ? getClientsByCycle(activeCycleId) : clients;

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum cliente cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Portfólio de Clientes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os clientes da CONSEJ
          </p>
        </div>
        <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione um ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.filter(c => c.is_visible).map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.label} {cycle.is_current && '(Atual)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {displayClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum cliente vinculado a este ciclo.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayClients.map((client) => {
            const members = activeCycleId ? getGTMembersByClient(client.id, activeCycleId) : [];
            const manager = members.find(m => m.role === 'manager');
            const managerProfile = manager ? getProfileByUserId(manager.user_id) : null;
            const executedDemands = getDemandCount(client.id);

            return (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary" />
                    {client.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* GT Members */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Equipe do GT ({members.length})
                    </div>
                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-6">
                        Nenhum membro alocado neste ciclo
                      </p>
                    ) : (
                      <div className="space-y-1.5 pl-6">
                        {members.map((member) => {
                          const p = getProfileByUserId(member.user_id);
                          return (
                            <div key={member.id} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={p?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(p?.display_name || null, p?.email || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate">{p?.display_name || p?.email || 'Usuário'}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeVariant(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Executed Demands Count */}
                  <div className="flex items-center gap-2 text-sm pl-6">
                    <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Demandas executadas:</span>
                    <Badge variant="secondary" className="font-semibold">{executedDemands}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
