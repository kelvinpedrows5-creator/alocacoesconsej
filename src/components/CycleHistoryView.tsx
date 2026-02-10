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
      
      const [profilesRes, allocationsRes, gtMembersRes] = await Promise.all([
        supabase.from('profiles').select('id, user_id, email, display_name, avatar_url'),
        supabase.from('member_allocations').select('*').eq('cycle_id', cycle.id),
        supabase.from('gt_members').select('*').eq('cycle_id', cycle.id),
      ]);

      setProfiles(profilesRes.data || []);
      setAllocations(allocationsRes.data || []);
      setGtMembers(gtMembersRes.data || []);
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

  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId);

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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
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
          <Tabs defaultValue="coordinations" className="flex-1 flex flex-col min-h-0 px-6 pb-6">
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

            <TabsContent value="coordinations" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="space-y-6 pr-4">
                  {directorates.map(directorate => {
                    const dirCoords = coordinations.filter(c => c.directorateId === directorate.id);
                    return (
                      <div key={directorate.id}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          {directorate.name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {dirCoords.map((coord, index) => {
                            const coordMembers = getMembersForCoordination(coord.id);
                            return (
                              <motion.div
                                key={coord.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="border border-border rounded-lg p-3 bg-card"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: coord.color }}
                                    />
                                    <span className="text-sm font-medium text-foreground truncate">
                                      {coord.name}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs shrink-0 ml-1">
                                    {coordMembers.length}
                                  </Badge>
                                </div>

                                {coordMembers.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">Nenhum membro</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {coordMembers.map(member => (
                                      <div
                                        key={member.id}
                                        className="flex items-center gap-1 bg-secondary/50 rounded-full pl-0.5 pr-2 py-0.5"
                                      >
                                        <Avatar className="h-4 w-4">
                                          <AvatarImage src={member.avatar_url || undefined} />
                                          <AvatarFallback
                                            className="text-[8px]"
                                            style={{ backgroundColor: `${coord.color}30`, color: coord.color }}
                                          >
                                            {getInitials(member.display_name, member.email)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[10px] text-foreground whitespace-nowrap">
                                          {member.display_name?.split(' ')[0] || member.email.split('@')[0]}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gts" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[calc(90vh-200px)]">
                {clients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Briefcase className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum grupo de trabalho neste ciclo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                    {clients.map((client, index) => {
                      const members = gtMembers.filter(m => m.client_id === client.id);
                      const director = members.find(m => m.role === 'director');
                      const manager = members.find(m => m.role === 'manager');
                      const consultants = members.filter(m => m.role === 'consultant');

                      return (
                        <motion.div
                          key={client.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border border-border rounded-lg p-3 bg-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Briefcase className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{client.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0 ml-1">
                              {members.length}
                            </Badge>
                          </div>

                          <div className="space-y-1.5">
                            {director && (() => {
                              const profile = getProfileByUserId(director.user_id);
                              return (
                                <div className="flex items-center gap-1.5 p-1.5 bg-primary/5 rounded-md">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                      {getInitials(profile?.display_name || null, profile?.email || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] truncate flex-1">
                                    {profile?.display_name || 'Diretor'}
                                  </span>
                                  <Badge className={`text-[8px] px-1 py-0 ${getRoleBadgeVariant('director')}`}>Dir.</Badge>
                                </div>
                              );
                            })()}

                            {manager && (() => {
                              const profile = getProfileByUserId(manager.user_id);
                              return (
                                <div className="flex items-center gap-1.5 p-1.5 bg-accent/5 rounded-md">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-[8px] bg-accent/10 text-accent">
                                      {getInitials(profile?.display_name || null, profile?.email || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[10px] truncate flex-1">
                                    {profile?.display_name || 'Gerente'}
                                  </span>
                                  <Badge className={`text-[8px] px-1 py-0 ${getRoleBadgeVariant('manager')}`}>Ger.</Badge>
                                </div>
                              );
                            })()}

                            {consultants.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {consultants.map(c => {
                                  const profile = getProfileByUserId(c.user_id);
                                  return (
                                    <div
                                      key={c.id}
                                      className="flex items-center gap-1 bg-secondary rounded-full pl-0.5 pr-1.5 py-0.5"
                                    >
                                      <Avatar className="h-3.5 w-3.5">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="text-[7px] bg-secondary text-secondary-foreground">
                                          {getInitials(profile?.display_name || null, profile?.email || '')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-[9px] whitespace-nowrap">
                                        {profile?.display_name?.split(' ')[0] || 'Consultor'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {members.length === 0 && (
                              <p className="text-xs text-muted-foreground italic text-center py-1">
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
