import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, FileText, UserPlus, Building } from 'lucide-react';
import { useClients, GT_PROFILE_QUESTIONS, Client } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function GTManagement() {
  const {
    clients,
    clientProfiles,
    gtMembers,
    isLoading,
    addClient,
    updateClient,
    deleteClient,
    upsertClientProfile,
    addGTMember,
    removeGTMember,
    getClientProfile,
    getGTMembersByClient,
  } = useClients();
  
  const { cycles, currentCycle } = useCycles();
  
  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_gt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const [newClientName, setNewClientName] = useState('');
  const [newClientDescription, setNewClientDescription] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'director' | 'manager' | 'consultant'>('consultant');
  const [selectedCycleId, setSelectedCycleId] = useState(currentCycle?.id || '');
  
  const [profileAnswers, setProfileAnswers] = useState<Record<string, string>>({});

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    addClient({ name: newClientName, description: newClientDescription || undefined });
    setNewClientName('');
    setNewClientDescription('');
    setIsAddClientOpen(false);
  };

  const handleOpenProfileDialog = (client: Client) => {
    setSelectedClient(client);
    const existingProfile = getClientProfile(client.id);
    if (existingProfile) {
      setProfileAnswers({
        question_1: existingProfile.question_1 || '',
        question_2: existingProfile.question_2 || '',
        question_3: existingProfile.question_3 || '',
        question_4: existingProfile.question_4 || '',
        question_5: existingProfile.question_5 || '',
        question_6: existingProfile.question_6 || '',
        question_7: existingProfile.question_7 || '',
        question_8: existingProfile.question_8 || '',
        question_9: existingProfile.question_9 || '',
        question_10: existingProfile.question_10 || '',
      });
    } else {
      setProfileAnswers({});
    }
    setIsProfileDialogOpen(true);
  };

  const handleSaveProfile = () => {
    if (!selectedClient) return;
    upsertClientProfile({
      client_id: selectedClient.id,
      ...profileAnswers,
    });
    setIsProfileDialogOpen(false);
  };

  const handleAddMember = () => {
    if (!selectedClient || !selectedMemberId || !selectedCycleId) return;
    addGTMember({
      client_id: selectedClient.id,
      user_id: selectedMemberId,
      role: selectedRole,
      cycle_id: selectedCycleId,
    });
    setSelectedMemberId('');
    setIsAddMemberOpen(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'consultant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Diretor';
      case 'manager': return 'Gerente';
      case 'consultant': return 'Consultor';
      default: return role;
    }
  };

  const getProfileByUserId = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getProfileCompleteness = (clientId: string) => {
    const profile = getClientProfile(clientId);
    if (!profile) return 0;
    
    let answered = 0;
    GT_PROFILE_QUESTIONS.forEach(q => {
      if (profile[q.key as keyof typeof profile]) answered++;
    });
    return Math.round((answered / GT_PROFILE_QUESTIONS.length) * 100);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Grupos de Trabalho (GTs)</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os clientes e a composição dos grupos de trabalho
          </p>
        </div>
        
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome do Cliente</Label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Empresa XYZ"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newClientDescription}
                  onChange={(e) => setNewClientDescription(e.target.value)}
                  placeholder="Breve descrição do cliente..."
                />
              </div>
              <Button onClick={handleAddClient} className="w-full">
                Adicionar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cycle selector */}
      <div className="flex items-center gap-4">
        <Label>Ciclo de visualização:</Label>
        <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.label} {cycle.is_current && '(Atual)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum cliente cadastrado ainda. Adicione seu primeiro cliente para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const members = getGTMembersByClient(client.id, selectedCycleId);
            const profileCompleteness = getProfileCompleteness(client.id);
            const director = members.find(m => m.role === 'director');
            const manager = members.find(m => m.role === 'manager');
            const consultants = members.filter(m => m.role === 'consultant');

            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{client.name}</CardTitle>
                      {client.description && (
                        <p className="text-xs text-muted-foreground mt-1">{client.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile completeness */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Perfil:</span>
                    <Badge variant={profileCompleteness === 100 ? 'default' : 'secondary'}>
                      {profileCompleteness}%
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => handleOpenProfileDialog(client)}
                    >
                      {profileCompleteness > 0 ? 'Editar' : 'Preencher'}
                    </Button>
                  </div>

                  {/* GT Composition */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Composição do GT</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6"
                        onClick={() => {
                          setSelectedClient(client);
                          setIsAddMemberOpen(true);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhum membro alocado neste ciclo
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {/* Director */}
                        {director && (
                          <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={getProfileByUserId(director.user_id)?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    getProfileByUserId(director.user_id)?.display_name || null,
                                    getProfileByUserId(director.user_id)?.email || ''
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {getProfileByUserId(director.user_id)?.display_name || 
                                 getProfileByUserId(director.user_id)?.email || 'Usuário'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleBadgeColor(director.role)}>
                                {getRoleLabel(director.role)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeGTMember(director.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Manager */}
                        {manager && (
                          <div className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={getProfileByUserId(manager.user_id)?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    getProfileByUserId(manager.user_id)?.display_name || null,
                                    getProfileByUserId(manager.user_id)?.email || ''
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {getProfileByUserId(manager.user_id)?.display_name || 
                                 getProfileByUserId(manager.user_id)?.email || 'Usuário'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleBadgeColor(manager.role)}>
                                {getRoleLabel(manager.role)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeGTMember(manager.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Consultants */}
                        {consultants.map((consultant) => (
                          <div key={consultant.id} className="flex items-center justify-between bg-muted/50 rounded-md p-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={getProfileByUserId(consultant.user_id)?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    getProfileByUserId(consultant.user_id)?.display_name || null,
                                    getProfileByUserId(consultant.user_id)?.email || ''
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {getProfileByUserId(consultant.user_id)?.display_name || 
                                 getProfileByUserId(consultant.user_id)?.email || 'Usuário'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleBadgeColor(consultant.role)}>
                                {getRoleLabel(consultant.role)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeGTMember(consultant.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do Cliente: {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {GT_PROFILE_QUESTIONS.map((question) => (
              <div key={question.key} className="space-y-2">
                <Label className="text-sm font-medium">{question.label}</Label>
                {'options' in question && question.options ? (
                  <Select
                    value={profileAnswers[question.key] || ''}
                    onValueChange={(value) => setProfileAnswers(prev => ({
                      ...prev,
                      [question.key]: value,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    value={profileAnswers[question.key] || ''}
                    onChange={(e) => setProfileAnswers(prev => ({
                      ...prev,
                      [question.key]: e.target.value,
                    }))}
                    placeholder="Sua resposta..."
                    rows={2}
                  />
                )}
              </div>
            ))}
            <Button onClick={handleSaveProfile} className="w-full">
              Salvar Perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao GT: {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.label} {cycle.is_current && '(Atual)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Membro</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.display_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Função no GT</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">Diretor de Demandas</SelectItem>
                  <SelectItem value="manager">Gerente de Demandas</SelectItem>
                  <SelectItem value="consultant">Consultor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Limite: 1 diretor, 1 gerente e até 3 consultores por GT/ciclo
              </p>
            </div>

            <Button onClick={handleAddMember} className="w-full" disabled={!selectedMemberId || !selectedCycleId}>
              Adicionar ao GT
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
