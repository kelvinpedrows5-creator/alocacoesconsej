import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Crown, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCycles } from '@/hooks/useCycles';
import { useLeadership } from '@/hooks/useLeadership';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { coordinations, directorates } from '@/data/mockData';

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AllocationData {
  user_id: string;
  coordination_id: string;
}

export const MembersSection = () => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [allocations, setAllocations] = useState<AllocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');
  const { currentCycle } = useCycles();
  const { positions } = useLeadership();

  useEffect(() => {
    fetchData();
  }, [currentCycle?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      if (currentCycle?.id) {
        const { data: allocationsData, error: allocationsError } = await supabase
          .from('member_allocations')
          .select('user_id, coordination_id')
          .eq('cycle_id', currentCycle.id);

        if (allocationsError) throw allocationsError;
        setAllocations(allocationsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (displayName: string | null, email: string) => {
    if (displayName) {
      return displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const getCoordinationForProfile = (userId: string) => {
    const allocation = allocations.find(a => a.user_id === userId);
    if (allocation) {
      return coordinations.find(c => c.id === allocation.coordination_id);
    }
    return null;
  };

  const getLeaderPosition = (userId: string) => {
    return positions.find(p => p.user_id === userId);
  };

  const getPositionTitle = (position: { position_type: string; directorate_id: string }) => {
    const dir = directorates.find(d => d.id === position.directorate_id);
    if (!dir) return position.position_type;
    
    if (position.position_type === 'director') {
      if (dir.id === 'dir-3') return 'Presidente Executivo';
      if (dir.id === 'dir-4') return 'Vice-Presidente';
      return `Diretor(a) de ${dir.name}`;
    }
    return `Gerente de ${dir.name}`;
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedDirectorate === 'all') return matchesSearch;
    
    const coord = getCoordinationForProfile(p.user_id);
    const leaderPos = getLeaderPosition(p.user_id);
    return matchesSearch && (coord?.directorateId === selectedDirectorate || leaderPos?.directorate_id === selectedDirectorate);
  });

  // Separate leaders from coordinators
  const leaders = filteredProfiles.filter(p => getLeaderPosition(p.user_id));
  const coordinatorProfiles = filteredProfiles.filter(p => !getLeaderPosition(p.user_id));

  const groupedByDirectorate = directorates.map((dir) => {
    const dirMembers = coordinatorProfiles.filter((p) => {
      const coord = getCoordinationForProfile(p.user_id);
      return coord?.directorateId === dir.id;
    });
    return { directorate: dir, members: dirMembers };
  });

  const unallocatedMembers = coordinatorProfiles.filter(p => !getCoordinationForProfile(p.user_id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Membros CONSEJ
        </CardTitle>
        <CardDescription>
          Visualize todos os membros da empresa e suas posições
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filtrar por diretoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Diretorias</SelectItem>
              {directorates.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  <span className="truncate">{dir.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {/* Leaders section */}
              {leaders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-foreground">Lideranças</h3>
                    <Badge variant="secondary" className="text-xs">
                      {leaders.length} membros
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leaders.map((profile) => {
                      const position = getLeaderPosition(profile.user_id);
                      const isDirector = position?.position_type === 'director';
                      return (
                        <motion.div
                          key={profile.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 transition-colors bg-card min-w-0"
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback 
                              className="text-sm"
                              style={{ 
                                backgroundColor: isDirector ? 'hsl(var(--chart-4) / 0.2)' : 'hsl(var(--primary) / 0.1)',
                                color: isDirector ? 'hsl(var(--chart-4))' : 'hsl(var(--primary))'
                              }}
                            >
                              {getInitials(profile.display_name, profile.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {profile.display_name || profile.email.split('@')[0]}
                            </p>
                            {position && (
                              <Badge
                                variant="outline"
                                className="text-xs mt-1 max-w-full"
                                style={{ 
                                  borderColor: isDirector ? 'hsl(var(--chart-4) / 0.5)' : 'hsl(var(--primary) / 0.5)',
                                  color: isDirector ? 'hsl(var(--chart-4))' : 'hsl(var(--primary))'
                                }}
                              >
                                {isDirector ? <Crown className="w-3 h-3 mr-1 inline" /> : <UserCheck className="w-3 h-3 mr-1 inline" />}
                                <span className="truncate">{getPositionTitle(position)}</span>
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Coordinators grouped by directorate */}
              {groupedByDirectorate
                .filter((group) => 
                  selectedDirectorate === 'all' || group.directorate.id === selectedDirectorate
                )
                .filter((group) => group.members.length > 0)
                .map((group) => (
                  <motion.div
                    key={group.directorate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <h3 className="font-semibold text-foreground">
                        {group.directorate.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {group.members.length} membros
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.members.map((profile) => {
                        const coord = getCoordinationForProfile(profile.user_id);
                        return (
                          <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 transition-colors bg-card min-w-0"
                          >
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback 
                                className="text-sm"
                                style={{ 
                                  backgroundColor: coord ? `${coord.color}20` : undefined, 
                                  color: coord?.color 
                                }}
                              >
                                {getInitials(profile.display_name, profile.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {profile.display_name || profile.email.split('@')[0]}
                              </p>
                              {coord && (
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-1 max-w-full"
                                  style={{ borderColor: `${coord.color}50`, color: coord.color }}
                                >
                                  <span className="truncate">{coord.name}</span>
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}

              {/* Unallocated members */}
              {selectedDirectorate === 'all' && unallocatedMembers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <h3 className="font-semibold text-muted-foreground">
                      Sem Alocação
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {unallocatedMembers.length} membros
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unallocatedMembers.map((profile) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-dashed hover:border-primary/30 transition-colors bg-card min-w-0"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-sm bg-muted">
                            {getInitials(profile.display_name, profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {profile.display_name || profile.email.split('@')[0]}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 text-muted-foreground">
                            Pendente
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {filteredProfiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
