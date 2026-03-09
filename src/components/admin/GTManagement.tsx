import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, FileText, UserPlus, Building, Sparkles, Users, X } from 'lucide-react';
import { useClients, GT_PROFILE_QUESTIONS, Client, ClientProfile } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useLeadership } from '@/hooks/useLeadership';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_skills: string | null;
  profile_work_style: string | null;
  profile_activities: string | null;
  profile_competencies: string | null;
  profile_communication_style: string | null;
  profile_problem_solving: string | null;
  profile_time_management: string | null;
  profile_team_role: string | null;
  profile_stress_handling: string | null;
}

function computeTeamSuggestion(clientProfile: ClientProfile, profiles: Profile[], leaderUserIds: Set<string>) {
  // Determine recommended team size based on complexity and contact frequency
  let recommendedSize = 2;
  
  const complexity = clientProfile.question_5;
  const contactFreq = clientProfile.question_2;
  const clientHistory = clientProfile.question_9;
  
  if (complexity?.includes('Alta')) recommendedSize = 3;
  else if (complexity?.includes('Baixa')) recommendedSize = 1;
  
  if (contactFreq?.includes('Alta')) recommendedSize = Math.min(3, recommendedSize + 1);
  if (clientHistory?.includes('novo')) recommendedSize = Math.min(3, recommendedSize + 1);
  
  // Score each coordinator (non-leader) for this client
  const coordinators = profiles.filter(p => !leaderUserIds.has(p.user_id));
  
  const scored = coordinators.map(profile => {
    let score = 0;
    
    // Client values results → analytical members
    if (clientProfile.question_1?.includes('Resultados tangíveis')) {
      if (profile.profile_skills === 'analytical') score += 3;
      if (profile.profile_competencies === 'finance') score += 2;
    }
    if (clientProfile.question_1?.includes('Inovação')) {
      if (profile.profile_skills === 'creative') score += 3;
      if (profile.profile_activities === 'innovation') score += 2;
    }
    if (clientProfile.question_1?.includes('Relacionamento')) {
      if (profile.profile_skills === 'people') score += 3;
      if (profile.profile_work_style === 'collaborative') score += 2;
    }
    
    // High contact → collaborative, direct communicators
    if (contactFreq?.includes('Alta') || contactFreq?.includes('Média')) {
      if (profile.profile_work_style === 'collaborative') score += 2;
      if (profile.profile_communication_style === 'direct') score += 2;
    }
    
    // Complex demands → specialists, analytical problem solvers
    if (complexity?.includes('Alta')) {
      if (profile.profile_team_role === 'specialist') score += 3;
      if (profile.profile_problem_solving === 'analytical_approach') score += 2;
    }
    
    // Urgent demands → deadline-driven, calm under pressure
    if (clientProfile.question_3?.includes('emergenciais')) {
      if (profile.profile_time_management === 'deadline_driven') score += 2;
      if (profile.profile_stress_handling === 'calm') score += 2;
    }
    
    // Structured demands → structured time management
    if (clientProfile.question_3?.includes('estruturadas')) {
      if (profile.profile_time_management === 'structured') score += 2;
    }
    
    // Critical feedback client → calm, mediator members
    if (clientProfile.question_10?.includes('Crítico')) {
      if (profile.profile_stress_handling === 'calm') score += 2;
      if (profile.profile_team_role === 'mediator') score += 2;
    }
    
    return { profile, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return {
    recommendedSize,
    topMatches: scored.slice(0, Math.max(5, recommendedSize + 2)),
  };
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
    linkClientToCycle,
    unlinkClientFromCycle,
    getClientProfile,
    getGTMembersByClient,
    getClientsByCycle,
    isClientInCycle,
  } = useClients();
  
  const { cycles, currentCycle } = useCycles();
  const { positions } = useLeadership();
  
  const leaderUserIds = useMemo(() => new Set(positions.map(p => p.user_id)), [positions]);
  
  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_gt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url, profile_skills, profile_work_style, profile_activities, profile_competencies, profile_communication_style, profile_problem_solving, profile_time_management, profile_team_role, profile_stress_handling');
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
  const [showSuggestion, setShowSuggestion] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'director' | 'manager' | 'consultant'>('consultant');
  const [selectedCycleId, setSelectedCycleId] = useState(currentCycle?.id || '');
  
  const [profileAnswers, setProfileAnswers] = useState<Record<string, string>>({});

  // Sync selectedCycleId when currentCycle loads
  useEffect(() => {
    if (currentCycle && !selectedCycleId) {
      setSelectedCycleId(currentCycle.id);
    }
  }, [currentCycle, selectedCycleId]);

  // Filter clients by selected cycle - show all if no cycle selected
  const activeCycleId = selectedCycleId || currentCycle?.id || '';
  const cycleClients = activeCycleId ? getClientsByCycle(activeCycleId) : clients;
  const unlinkedClients = activeCycleId ? clients.filter(c => !isClientInCycle(c.id, activeCycleId)) : [];

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    addClient({ 
      name: newClientName, 
      description: newClientDescription || undefined,
      cycleId: selectedCycleId || undefined,
    });
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
    setShowSuggestion(selectedClient.id);
  };

  const getTeamSuggestion = (clientId: string) => {
    const cp = getClientProfile(clientId);
    if (!cp) return null;
    // Check if profile has meaningful answers
    const answered = GT_PROFILE_QUESTIONS.filter(q => cp[q.key as keyof typeof cp]).length;
    if (answered < 3) return null;
    return computeTeamSuggestion(cp, profiles, leaderUserIds);
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
      case 'director': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'consultant': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
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

      {/* All clients with cycle toggle */}
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
        <>
          {/* Clients NOT in this cycle */}
          {selectedCycleId && clients.filter(c => !isClientInCycle(c.id, selectedCycleId)).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Clientes não vinculados a este ciclo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {clients.filter(c => !isClientInCycle(c.id, selectedCycleId)).map(client => (
                    <Button
                      key={client.id}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => linkClientToCycle({ clientId: client.id, cycleId: selectedCycleId })}
                    >
                      <Plus className="h-3 w-3" />
                      {client.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cycleClients.map((client) => {
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
                    <div className="flex items-center gap-1">
                      {selectedCycleId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Remover do ciclo"
                          onClick={() => unlinkClientFromCycle({ clientId: client.id, cycleId: selectedCycleId })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

                  {/* Team Suggestion */}
                  {(() => {
                    const suggestion = getTeamSuggestion(client.id);
                    if (!suggestion) return null;
                    const isOpen = showSuggestion === client.id;
                    return (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 w-full justify-start"
                          onClick={() => setShowSuggestion(isOpen ? null : client.id)}
                        >
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          Sugestão de Equipe
                        </Button>
                        {isOpen && (
                          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-accent" />
                              <span className="text-sm font-medium text-foreground">
                                Consultores recomendados: {suggestion.recommendedSize}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Membros com melhor compatibilidade:
                            </p>
                            <div className="space-y-1">
                              {suggestion.topMatches.map(({ profile: p, score }) => (
                                <div key={p.user_id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={p.avatar_url || undefined} />
                                      <AvatarFallback className="text-[10px]">
                                        {getInitials(p.display_name, p.email)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-xs text-foreground">{p.display_name || p.email}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] h-5">
                                    {score > 0 ? `${score} pts` : '—'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
          </div>
        </>
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
