import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users, Plus, Trash2, Building2 } from 'lucide-react';
import { useLeadership, LeadershipWithProfile } from '@/hooks/useLeadership';
import { supabase } from '@/integrations/supabase/client';
import { directorates } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProfileOption {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export const LeadershipManagement = () => {
  const { positions, loading, addPosition, removePosition, getDirectorateLeaders } = useLeadership();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('');
  const [selectedPositionType, setSelectedPositionType] = useState<'manager' | 'director'>('manager');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
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

  const handleAddPosition = async () => {
    if (!selectedUser || !selectedDirectorate) return;
    setAdding(true);
    await addPosition(selectedUser, selectedDirectorate, selectedPositionType);
    setAdding(false);
    setShowAddDialog(false);
    setSelectedUser('');
    setSelectedDirectorate('');
  };

  const getDirectorateName = (dirId: string) => {
    return directorates.find((d) => d.id === dirId)?.name || dirId;
  };

  // Check if user can be added as specific position type in a directorate
  const canAddPosition = (directorateId: string, positionType: 'manager' | 'director') => {
    const { directors, managers } = getDirectorateLeaders(directorateId);
    if (positionType === 'director') return directors.length < 1;
    return managers.length < 2;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Gestão de Lideranças
              </CardTitle>
              <CardDescription>
                Defina gerentes e diretores por diretoria
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Liderança
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue={directorates[0]?.id} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                {directorates.map((dir) => (
                  <TabsTrigger key={dir.id} value={dir.id} className="text-xs">
                    {dir.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {directorates.map((dir) => {
                const { directors, managers } = getDirectorateLeaders(dir.id);
                
                return (
                  <TabsContent key={dir.id} value={dir.id}>
                    <div className="space-y-4">
                      {/* Directors Section */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <h4 className="font-medium text-sm">Diretores (máx. 1)</h4>
                        </div>
                        {directors.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-6">
                            Nenhum diretor atribuído
                          </p>
                        ) : (
                          <div className="space-y-2 pl-6">
                            {directors.map((leader) => (
                              <LeaderCard
                                key={leader.id}
                                leader={leader}
                                onRemove={removePosition}
                                getInitials={getInitials}
                                type="director"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Managers Section */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium text-sm">Gerentes (máx. 2)</h4>
                        </div>
                        {managers.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-6">
                            Nenhum gerente atribuído
                          </p>
                        ) : (
                          <div className="space-y-2 pl-6">
                            {managers.map((leader) => (
                              <LeaderCard
                                key={leader.id}
                                leader={leader}
                                onRemove={removePosition}
                                getInitials={getInitials}
                                type="manager"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Leadership Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Liderança</DialogTitle>
            <DialogDescription>
              Selecione um membro e atribua um cargo de liderança
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Cargo</Label>
              <Select
                value={selectedPositionType}
                onValueChange={(v) => setSelectedPositionType(v as 'manager' | 'director')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Diretor
                    </span>
                  </SelectItem>
                  <SelectItem value="manager">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Gerente
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Diretoria</Label>
              <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma diretoria" />
                </SelectTrigger>
                <SelectContent>
                  {directorates.map((dir) => {
                    const canAdd = canAddPosition(dir.id, selectedPositionType);
                    return (
                      <SelectItem key={dir.id} value={dir.id} disabled={!canAdd}>
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {dir.name}
                          {!canAdd && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              Limite atingido
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Membro</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {profiles.map((profile) => {
                      // Check if user already has this position type in this directorate
                      const hasPosition = positions.some(
                        (p) =>
                          p.user_id === profile.user_id &&
                          p.directorate_id === selectedDirectorate &&
                          p.position_type === selectedPositionType
                      );
                      return (
                        <SelectItem
                          key={profile.user_id}
                          value={profile.user_id}
                          disabled={hasPosition}
                        >
                          <span className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(profile.display_name, profile.email)}
                              </AvatarFallback>
                            </Avatar>
                            {profile.display_name || profile.email}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddPosition}
              disabled={adding || !selectedUser || !selectedDirectorate}
            >
              {adding ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface LeaderCardProps {
  leader: LeadershipWithProfile;
  onRemove: (id: string) => void;
  getInitials: (displayName: string | null, email: string) => string;
  type: 'manager' | 'director';
}

const LeaderCard = ({ leader, onRemove, getInitials, type }: LeaderCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-3 rounded-lg border bg-card"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={leader.avatar_url || undefined} />
          <AvatarFallback
            className={type === 'director' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}
          >
            {getInitials(leader.display_name, leader.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{leader.display_name || leader.email}</p>
          <p className="text-xs text-muted-foreground">{leader.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(leader.id)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
