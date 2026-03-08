import { useState, useEffect } from 'react';
import { Crown, Users, Plus, Trash2 } from 'lucide-react';
import { useLeadership } from '@/hooks/useLeadership';
import { supabase } from '@/integrations/supabase/client';
import { directorates } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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

export const LeadershipDialog = () => {
  const { loading, addPosition, removePosition, getDirectorateLeaders } = useLeadership();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDirectorate, setSelectedDirectorate] = useState('');
  const [selectedPositionType, setSelectedPositionType] = useState<'manager' | 'director'>('manager');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (open) {
      supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .order('display_name', { ascending: true })
        .then(({ data }) => setProfiles(data || []));
    }
  }, [open]);

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

  const handleAdd = async () => {
    if (!selectedUser || !selectedDirectorate) return;
    setAdding(true);
    await addPosition(selectedUser, selectedDirectorate, selectedPositionType);
    setAdding(false);
    setShowAddForm(false);
    setSelectedUser('');
    setSelectedDirectorate('');
  };

  const canAddPosition = (directorateId: string, positionType: 'manager' | 'director') => {
    const { directors } = getDirectorateLeaders(directorateId);
    if (positionType === 'director') return directors.length < 1;
    return true;
  };

  const getPositionTitle = (positionType: string, directorateId: string) => {
    const dir = directorates.find(d => d.id === directorateId);
    if (!dir) return positionType === 'director' ? 'Diretor' : 'Gerente';
    
    if (positionType === 'director') {
      if (dir.id === 'dir-3') return 'Presidente Executivo';
      if (dir.id === 'dir-4') return 'Vice-Presidente';
      return `Diretor de ${dir.name}`;
    }
    return `Gerente de ${dir.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Crown className="w-4 h-4" />
          <span className="hidden sm:inline">Lideranças Formais</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Diretoria Executiva
          </DialogTitle>
          <DialogDescription>
            Gerencie as alocações de diretores e gerentes por diretoria
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue={directorates[0]?.id} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-2">
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
                      {/* Directors */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <h4 className="font-medium text-sm">Diretor (máx. 1)</h4>
                        </div>
                        {directors.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-6">Nenhum diretor</p>
                        ) : (
                          <div className="space-y-2 pl-6">
                            {directors.map((leader) => (
                              <div key={leader.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={leader.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                                      {getInitials(leader.display_name, leader.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{leader.display_name || leader.email}</p>
                                    <p className="text-xs text-muted-foreground">{getPositionTitle('director', dir.id)}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePosition(leader.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Managers */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium text-sm">Gerentes (máx. 2)</h4>
                        </div>
                        {managers.length === 0 ? (
                          <p className="text-sm text-muted-foreground pl-6">Nenhum gerente</p>
                        ) : (
                          <div className="space-y-2 pl-6">
                            {managers.map((leader) => (
                              <div key={leader.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={leader.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">
                                      {getInitials(leader.display_name, leader.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{leader.display_name || leader.email}</p>
                                    <p className="text-xs text-muted-foreground">{getPositionTitle('manager', dir.id)}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePosition(leader.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>

            {/* Add form */}
            {showAddForm ? (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="space-y-2">
                  <Label>Tipo de Cargo</Label>
                  <Select value={selectedPositionType} onValueChange={(v) => setSelectedPositionType(v as 'manager' | 'director')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="director"><span className="flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Diretor</span></SelectItem>
                      <SelectItem value="manager"><span className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" />Gerente</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Diretoria</Label>
                  <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {directorates.map((dir) => {
                        const canAdd = canAddPosition(dir.id, selectedPositionType);
                        return (
                          <SelectItem key={dir.id} value={dir.id} disabled={!canAdd}>
                            {dir.name} {!canAdd && '(Limite atingido)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Membro</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {profiles.map((p) => (
                          <SelectItem key={p.user_id} value={p.user_id}>
                            <span className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={p.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(p.display_name, p.email)}</AvatarFallback>
                              </Avatar>
                              {p.display_name || p.email}
                            </span>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleAdd} disabled={adding || !selectedUser || !selectedDirectorate}>
                    {adding ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4" />
                Adicionar Liderança
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
