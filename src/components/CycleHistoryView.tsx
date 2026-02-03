import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AllocationCycle } from '@/hooks/useCycles';
import { useClients } from '@/hooks/useClients';
import { coordinations, directorates } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CycleHistoryViewProps {
  cycle: AllocationCycle;
  open: boolean;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const CycleHistoryView = ({ cycle, open, onClose }: CycleHistoryViewProps) => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [gtMembers, setGtMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { clients } = useClients();

  useEffect(() => {
    if (open && cycle) {
      fetchHistoricalData();
    }
  }, [open, cycle?.id]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url');
      
      setProfiles(profilesData || []);

      // Fetch allocations for this cycle
      const { data: allocationsData } = await supabase
        .from('member_allocations')
        .select('*')
        .eq('cycle_id', cycle.id);
      
      setAllocations(allocationsData || []);

      // Fetch GT members for this cycle
      const { data: gtMembersData } = await supabase
        .from('gt_members')
        .select('*')
        .eq('cycle_id', cycle.id);
      
      setGtMembers(gtMembersData || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'director': return 'bg-primary/10 text-primary';
      case 'manager': return 'bg-accent/10 text-accent';
      case 'consultant': return 'bg-secondary text-secondary-foreground';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Organização em {cycle.label}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="coordinations" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full sm:w-auto flex-shrink-0">
              <TabsTrigger value="coordinations" className="gap-2">
                <Building2 className="w-4 h-4" />
                Coordenadorias
              </TabsTrigger>
              <TabsTrigger value="gts" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Grupos de Trabalho
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coordinations" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {coordinations.map((coord, index) => {
                    const coordMembers = getMembersForCoordination(coord.id);
                    const directorate = directorates.find(d => d.id === coord.directorateId);

                    return (
                      <motion.div
                        key={coord.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border border-border rounded-xl p-4 bg-card"
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
                            {directorate && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {directorate.name}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                            {coordMembers.length}
                          </Badge>
                        </div>

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
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gts" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[500px]">
                {clients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum grupo de trabalho neste ciclo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {clients.map((client, index) => {
                      const members = gtMembers.filter(m => m.client_id === client.id);
                      const director = members.find(m => m.role === 'director');
                      const manager = members.find(m => m.role === 'manager');
                      const consultants = members.filter(m => m.role === 'consultant');

                      return (
                        <motion.div
                          key={client.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border border-border rounded-xl p-4 bg-card"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary shrink-0" />
                                <h3 className="font-medium text-foreground truncate">{client.name}</h3>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                              {members.length}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {director && (
                              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={getProfileByUserId(director.user_id)?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(
                                      getProfileByUserId(director.user_id)?.display_name || null,
                                      getProfileByUserId(director.user_id)?.email || ''
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate flex-1">
                                  {getProfileByUserId(director.user_id)?.display_name || 'Diretor'}
                                </span>
                                <Badge className={`text-[9px] ${getRoleBadgeVariant('director')}`}>
                                  Dir.
                                </Badge>
                              </div>
                            )}

                            {manager && (
                              <div className="flex items-center gap-2 p-2 bg-accent/5 rounded-lg">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={getProfileByUserId(manager.user_id)?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] bg-accent/10 text-accent">
                                    {getInitials(
                                      getProfileByUserId(manager.user_id)?.display_name || null,
                                      getProfileByUserId(manager.user_id)?.email || ''
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate flex-1">
                                  {getProfileByUserId(manager.user_id)?.display_name || 'Gerente'}
                                </span>
                                <Badge className={`text-[9px] ${getRoleBadgeVariant('manager')}`}>
                                  Ger.
                                </Badge>
                              </div>
                            )}

                            {consultants.length > 0 && (
                              <ScrollArea className="w-full">
                                <div className="flex gap-1 pb-2">
                                  {consultants.map(c => {
                                    const profile = getProfileByUserId(c.user_id);
                                    return (
                                      <div 
                                        key={c.id}
                                        className="flex items-center gap-1 bg-secondary rounded-full pl-0.5 pr-2 py-0.5 shrink-0"
                                      >
                                        <Avatar className="h-4 w-4">
                                          <AvatarImage src={profile?.avatar_url || undefined} />
                                          <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
                                            {getInitials(profile?.display_name || null, profile?.email || '')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] whitespace-nowrap">
                                          {profile?.display_name?.split(' ')[0] || 'Consultor'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            )}

                            {members.length === 0 && (
                              <p className="text-xs text-muted-foreground italic text-center py-2">
                                Sem membros neste ciclo
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
        )}
      </DialogContent>
    </Dialog>
  );
};
