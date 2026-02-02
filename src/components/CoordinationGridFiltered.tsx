import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLeadership } from '@/hooks/useLeadership';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Building2, Filter, Crown, UserCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useCycles } from '@/hooks/useCycles';
import { coordinations, directorates } from '@/data/mockData';

interface CoordinationGridFilteredProps {
  showMemberPhotos?: boolean;
}

type LeadershipFilter = 'all' | 'directors' | 'managers';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface AllocationData {
  user_id: string;
  coordination_id: string;
}

export const CoordinationGridFiltered = ({ showMemberPhotos = true }: CoordinationGridFilteredProps) => {
  const { getDirectorateLeaders, loading: loadingLeadership } = useLeadership();
  const { currentCycle } = useCycles();
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');
  const [leadershipFilter, setLeadershipFilter] = useState<LeadershipFilter>('all');
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [allocations, setAllocations] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentCycle?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, email, avatar_url');
      
      setProfiles(profilesData || []);

      // Fetch allocations for current cycle
      if (currentCycle?.id) {
        const { data: allocationsData } = await supabase
          .from('member_allocations')
          .select('user_id, coordination_id')
          .eq('cycle_id', currentCycle.id);
        
        setAllocations(allocationsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMembersForCoord = (coordId: string) => {
    const userIds = allocations
      .filter(a => a.coordination_id === coordId)
      .map(a => a.user_id);
    return profiles.filter(p => userIds.includes(p.user_id));
  };

  const getDirectorate = (directorateId: string) =>
    directorates.find(d => d.id === directorateId);

  const filteredCoordinations = selectedDirectorate === 'all'
    ? coordinations
    : coordinations.filter(c => c.directorateId === selectedDirectorate);

  const getInitials = (name: string | null, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  // Get leadership for a directorate
  const getLeadershipInfo = (directorateId: string) => {
    const { directors, managers } = getDirectorateLeaders(directorateId);
    return { directors, managers };
  };

  // Get unique directorates with leaders
  const directoratesWithLeadership = directorates.map(dir => {
    const { directors, managers } = getLeadershipInfo(dir.id);
    return {
      ...dir,
      directors,
      managers,
    };
  });

  if (loading) {
    return (
      <div className="bg-card rounded-xl card-shadow p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl card-shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Visão por Coordenadorias</h2>
            <p className="text-sm text-muted-foreground">Distribuição atual dos membros</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Leadership filter */}
          <Select value={leadershipFilter} onValueChange={(v) => setLeadershipFilter(v as LeadershipFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filtrar liderança" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Todos
                </div>
              </SelectItem>
              <SelectItem value="directors">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Diretores
                </div>
              </SelectItem>
              <SelectItem value="managers">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Gerentes
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Directorate filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por diretoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Todas as Diretorias
                  </div>
                </SelectItem>
                {directorates.map((dir) => (
                  <SelectItem key={dir.id} value={dir.id}>
                    <span className="truncate">{dir.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Leadership panel when filter is active */}
      {leadershipFilter !== 'all' && (
        <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            {leadershipFilter === 'directors' ? (
              <>
                <Crown className="w-4 h-4 text-amber-500" />
                Diretores por Diretoria
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-primary" />
                Gerentes por Diretoria
              </>
            )}
          </h3>
          
          {loadingLeadership ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directoratesWithLeadership
                .filter(dir => selectedDirectorate === 'all' || dir.id === selectedDirectorate)
                .map(dir => {
                  const leaders = leadershipFilter === 'directors' ? dir.directors : dir.managers;
                  
                  return (
                    <div key={dir.id} className="p-3 bg-card rounded-lg border">
                      <p className="font-medium text-sm text-foreground mb-2">{dir.name}</p>
                      {leaders.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Nenhum {leadershipFilter === 'directors' ? 'diretor' : 'gerente'} atribuído
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {leaders.map(leader => (
                            <div key={leader.id} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={leader.avatar_url || undefined} />
                                <AvatarFallback 
                                  className={`text-xs ${
                                    leadershipFilter === 'directors' 
                                      ? 'bg-amber-500/10 text-amber-600' 
                                      : 'bg-primary/10 text-primary'
                                  }`}
                                >
                                  {getInitials(leader.display_name, leader.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground truncate">
                                {leader.display_name || leader.email}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Directorate header when filtered */}
      {selectedDirectorate !== 'all' && leadershipFilter === 'all' && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {getDirectorate(selectedDirectorate)?.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {getDirectorate(selectedDirectorate)?.description}
              </p>
            </div>
            {/* Show leadership for this directorate */}
            {(() => {
              const { directors, managers } = getLeadershipInfo(selectedDirectorate);
              return (
                <div className="flex items-center gap-4 shrink-0">
                  {directors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <div className="flex -space-x-1">
                        {directors.map(d => (
                          <Avatar key={d.id} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={d.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                              {getInitials(d.display_name, d.email)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                  {managers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <div className="flex -space-x-1">
                        {managers.map(m => (
                          <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={m.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(m.display_name, m.email)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoordinations.map((coord, index) => {
          const coordMembers = getMembersForCoord(coord.id);
          const directorate = getDirectorate(coord.directorateId);

          return (
            <motion.div
              key={coord.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
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
                  {coordMembers.length}/{coord.maxMembers}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {coordMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum membro</p>
                ) : (
                  coordMembers.slice(0, 6).map(member => {
                    const initials = getInitials(member.display_name, member.email);
                    const displayName = member.display_name || member.email.split('@')[0];
                    return (
                      <div 
                        key={member.id}
                        className="flex items-center gap-1.5 bg-secondary/50 rounded-full pl-0.5 pr-2 py-0.5"
                      >
                        <Avatar className="h-5 w-5">
                          {showMemberPhotos && member.avatar_url && (
                            <AvatarImage src={member.avatar_url} alt={displayName} />
                          )}
                          <AvatarFallback 
                            className="text-[10px]"
                            style={{ backgroundColor: `${coord.color}30`, color: coord.color }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-foreground truncate max-w-[60px]">
                          {displayName.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })
                )}
                {coordMembers.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{coordMembers.length - 6}
                  </Badge>
                )}
              </div>

              {/* Capacity bar */}
              <div className="mt-3">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((coordMembers.length / coord.maxMembers) * 100, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: coord.color }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
