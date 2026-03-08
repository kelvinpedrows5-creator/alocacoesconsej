import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Crown, UserCheck, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useLeadership } from '@/hooks/useLeadership';
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { coordinations, directorates } from '@/data/mockData';

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MemberAllocationData {
  id: string;
  user_id: string;
  cycle_id: string;
  coordination_id: string;
}

export const CompanyOverview = () => {
  const [viewMode, setViewMode] = useState<'coordinations' | 'gts'>('coordinations');
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [allocations, setAllocations] = useState<MemberAllocationData[]>([]);
  const [loading, setLoading] = useState(true);

  const { getDirectorateLeaders } = useLeadership();
  const { clients, gtMembers, isLoading: gtLoading } = useClients();
  const { currentCycle } = useCycles();

  useEffect(() => {
    fetchData();
  }, [currentCycle?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url');
      
      setProfiles(profilesData || []);

      // Fetch allocations for current cycle
      if (currentCycle?.id) {
        const { data: allocationsData } = await supabase
          .from('member_allocations')
          .select('id, user_id, cycle_id, coordination_id')
          .eq('cycle_id', currentCycle.id);
        
        setAllocations(allocationsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  const getProfileByUserId = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  const getMembersForCoordination = (coordId: string) => {
    return allocations
      .filter(a => a.coordination_id === coordId)
      .map(a => getProfileByUserId(a.user_id))
      .filter(Boolean) as ProfileData[];
  };

  const filteredCoordinations = selectedDirectorate === 'all'
    ? coordinations
    : coordinations.filter(c => c.directorateId === selectedDirectorate);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Diretor de Demandas';
      case 'manager': return 'Gerente de Demandas';
      case 'consultant': return 'Consultor';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'consultant': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return '';
    }
  };

  const currentGtMembers = gtMembers.filter(m => m.cycle_id === currentCycle?.id);

  if (loading || gtLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Visão Geral da Empresa</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Distribuição de membros por coordenadorias e grupos de trabalho
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'coordinations' | 'gts')}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="coordinations" className="gap-2 flex-1 sm:flex-none">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Coordenadorias</span>
                  <span className="sm:hidden">Coord.</span>
                </TabsTrigger>
                <TabsTrigger value="gts" className="gap-2 flex-1 sm:flex-none">
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Grupos de Trabalho</span>
                  <span className="sm:hidden">GTs</span>
                </TabsTrigger>
              </TabsList>

              {viewMode === 'coordinations' && (
                <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Filtrar por diretoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Diretorias</SelectItem>
                    {directorates.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id}>
                        {dir.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <TabsContent value="coordinations" className="mt-0">
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoordinations.map((coord, index) => {
                    const coordMembers = getMembersForCoordination(coord.id);
                    const directorate = directorates.find(d => d.id === coord.directorateId);
                    const { directors, managers } = getDirectorateLeaders(coord.directorateId);

                    return (
                      <motion.div
                        key={coord.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: coord.color }}
                              />
                              <h3 className="font-medium text-foreground truncate">{coord.name}</h3>
                            </div>
                            {directorate && selectedDirectorate === 'all' && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {directorate.name}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                            {coordMembers.length} {coordMembers.length === 1 ? 'membro' : 'membros'}
                          </Badge>
                        </div>

                        {/* Leadership for this directorate */}
                        {(directors.length > 0 || managers.length > 0) && (
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {directors.slice(0, 1).map(d => (
                              <div key={d.id} className="flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={d.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-600">
                                    {getInitials(d.display_name, d.email)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ))}
                            {managers.slice(0, 2).map(m => (
                              <div key={m.id} className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-primary shrink-0" />
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={m.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(m.display_name, m.email)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ))}
                          </div>
                        )}

                        <ScrollArea className="w-full">
                          <div className="flex gap-1.5 pb-2">
                            {coordMembers.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">Nenhum membro</p>
                            ) : (
                              coordMembers.map(member => (
                                <div 
                                  key={member.id}
                                  className="flex items-center gap-1.5 bg-secondary/50 rounded-full pl-0.5 pr-2 py-0.5 shrink-0"
                                >
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback 
                                      className="text-[10px]"
                                      style={{ backgroundColor: `${coord.color}30`, color: coord.color }}
                                    >
                                      {getInitials(member.display_name, member.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-foreground whitespace-nowrap">
                                    {member.display_name?.split(' ')[0] || member.email.split('@')[0]}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        {/* Capacity bar */}
                        <div className="mt-3">
                          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((coordMembers.length / coord.maxMembers) * 100, 100)}%` }}
                              transition={{ duration: 0.5, delay: index * 0.03 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: coord.color }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gts" className="mt-0">
              <ScrollArea className="h-[500px] pr-4">
                {clients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum grupo de trabalho cadastrado ainda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map((client, index) => {
                      const members = currentGtMembers.filter(m => m.client_id === client.id);
                      const director = members.find(m => m.role === 'director');
                      const manager = members.find(m => m.role === 'manager');
                      const consultants = members.filter(m => m.role === 'consultant');

                      return (
                        <motion.div
                          key={client.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors bg-card"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary shrink-0" />
                                <h3 className="font-medium text-foreground truncate">{client.name}</h3>
                              </div>
                              {client.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {client.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                              {members.length} membros
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {director && (
                              <div className="flex items-center gap-2 p-2 bg-purple-900/20 rounded-lg">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={getProfileByUserId(director.user_id)?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs bg-purple-800 text-purple-200">
                                    {getInitials(
                                      getProfileByUserId(director.user_id)?.display_name || null,
                                      getProfileByUserId(director.user_id)?.email || ''
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {getProfileByUserId(director.user_id)?.display_name || 
                                     getProfileByUserId(director.user_id)?.email}
                                  </p>
                                  <Badge className={`text-[10px] ${getRoleBadgeVariant('director')}`}>
                                    {getRoleLabel('director')}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {manager && (
                              <div className="flex items-center gap-2 p-2 bg-blue-900/20 rounded-lg">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={getProfileByUserId(manager.user_id)?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs bg-blue-800 text-blue-200">
                                    {getInitials(
                                      getProfileByUserId(manager.user_id)?.display_name || null,
                                      getProfileByUserId(manager.user_id)?.email || ''
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {getProfileByUserId(manager.user_id)?.display_name || 
                                     getProfileByUserId(manager.user_id)?.email}
                                  </p>
                                  <Badge className={`text-[10px] ${getRoleBadgeVariant('manager')}`}>
                                    {getRoleLabel('manager')}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {consultants.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {consultants.map(consultant => (
                                  <div 
                                    key={consultant.id}
                                    className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 rounded-full pl-0.5 pr-2 py-0.5"
                                  >
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={getProfileByUserId(consultant.user_id)?.avatar_url || undefined} />
                                      <AvatarFallback className="text-[10px] bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                                        {getInitials(
                                          getProfileByUserId(consultant.user_id)?.display_name || null,
                                          getProfileByUserId(consultant.user_id)?.email || ''
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-foreground truncate max-w-[80px]">
                                      {getProfileByUserId(consultant.user_id)?.display_name?.split(' ')[0] || 
                                       getProfileByUserId(consultant.user_id)?.email?.split('@')[0]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {members.length === 0 && (
                              <p className="text-sm text-muted-foreground italic text-center py-2">
                                Nenhum membro alocado
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
