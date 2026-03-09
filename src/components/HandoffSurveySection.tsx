import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GTHandoffSurvey, GTHandoffSurveyResults } from '@/components/GTHandoffSurvey';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function HandoffSurveySection() {
  const { clients, gtMembers, getGTMembersByClient, getClientsByCycle } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { profile, user } = useAuthContext();
  const { positions } = useLeadership();
  const queryClient = useQueryClient();
  const [surveyDialog, setSurveyDialog] = useState<{ clientId: string; clientName: string; cycleId: string; cycleLabel: string } | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_handoff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url');
      if (error) throw error;
      return data as Profile[];
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

  const isUserInGT = (clientId: string, cycleId: string) => {
    if (!profile?.user_id) return false;
    return gtMembers.some(m => m.client_id === clientId && m.cycle_id === cycleId && m.user_id === profile.user_id);
  };

  const isUserConsultantInGT = (clientId: string, cycleId: string) => {
    if (!profile?.user_id) return false;
    return gtMembers.some(m => 
      m.client_id === clientId && 
      m.cycle_id === cycleId && 
      m.user_id === profile.user_id && 
      m.role === 'consultant'
    );
  };

  // Check if user is demandas manager or director
  const isDemandasLeadership = user
    ? positions.some(
        (p) => p.user_id === user.id && p.directorate_id === 'dir-1' && (p.position_type === 'manager' || p.position_type === 'director')
      )
    : false;

  // Find previous cycle for handoff survey
  const visibleCycles = cycles.filter(c => c.is_visible).sort((a, b) => b.value.localeCompare(a.value));
  const currentCycleIndex = visibleCycles.findIndex(c => c.id === currentCycle?.id);
  const previousCycle = currentCycleIndex >= 0 && currentCycleIndex < visibleCycles.length - 1 
    ? visibleCycles[currentCycleIndex + 1] 
    : null;

  // Check if surveys can be answered (only when there's a new current cycle)
  const canAnswerSurveys = !!currentCycle && !!previousCycle;
  
  const activeCycleId = previousCycle?.id || '';
  const activeCycle = previousCycle;

  // Get clients from previous cycle where user was consultant in GT
  const cycleClients = activeCycleId 
    ? getClientsByCycle(activeCycleId).filter(client => isUserConsultantInGT(client.id, activeCycleId))
    : [];

  // Check which surveys are already completed for previous cycle (by ANY consultant)
  const { data: completedSurveysByClient = {} } = useQuery({
    queryKey: ['handoff_surveys_by_client', activeCycleId],
    queryFn: async () => {
      if (!activeCycleId) return {};
      const { data } = await supabase
        .from('gt_handoff_surveys')
        .select('client_id, user_id')
        .eq('cycle_id', activeCycleId);
      
      // Group by client_id
      const grouped: Record<string, string[]> = {};
      (data || []).forEach(survey => {
        if (!grouped[survey.client_id]) {
          grouped[survey.client_id] = [];
        }
        grouped[survey.client_id].push(survey.user_id);
      });
      return grouped;
    },
    enabled: !!activeCycleId,
  });

  // Check if current user completed survey for each client
  const { data: userCompletedSurveys = [] } = useQuery({
    queryKey: ['user_completed_handoff_surveys', activeCycleId, profile?.user_id],
    queryFn: async () => {
      if (!activeCycleId || !profile?.user_id) return [];
      const { data } = await supabase
        .from('gt_handoff_surveys')
        .select('client_id')
        .eq('cycle_id', activeCycleId)
        .eq('user_id', profile.user_id);
      return (data || []).map(s => s.client_id);
    },
    enabled: !!activeCycleId && !!profile?.user_id,
  });

  // Separate clients: those needing response (no one answered) vs completed (someone answered)
  const pendingSurveyClients = cycleClients.filter(
    client => !completedSurveysByClient[client.id] || completedSurveysByClient[client.id].length === 0
  );

  const completedSurveyClients = cycleClients.filter(
    client => completedSurveysByClient[client.id] && completedSurveysByClient[client.id].length > 0
  );

  // Get all clients with surveys for leadership view
  const { data: allClientsWithSurveys = [] } = useQuery({
    queryKey: ['all_clients_with_handoff_surveys', activeCycleId],
    queryFn: async () => {
      if (!activeCycleId) return [];
      const { data } = await supabase
        .from('gt_handoff_surveys')
        .select(`
          client_id,
          user_id,
          created_at,
          clients (
            id,
            name
          )
        `)
        .eq('cycle_id', activeCycleId)
        .order('created_at', { ascending: false });
      
      return data || [];
    },
    enabled: !!activeCycleId && isDemandasLeadership,
  });

  // Group surveys by client for leadership view
  const clientSurveysMap = allClientsWithSurveys.reduce((acc: any, survey: any) => {
    const clientId = survey.client_id;
    if (!acc[clientId]) {
      acc[clientId] = {
        clientId,
        clientName: survey.clients?.name || 'Cliente',
        surveys: []
      };
    }
    acc[clientId].surveys.push({
      userId: survey.user_id,
      createdAt: survey.created_at
    });
    return acc;
  }, {});

  const leadershipClients = Object.values(clientSurveysMap);

  // Consultant view
  const ConsultantView = () => {
    if (!activeCycle) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Não há ciclo anterior disponível para passagem de bastão.</p>
          </CardContent>
        </Card>
      );
    }

    if (cycleClients.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Você não estava alocado como consultor em nenhum Grupo de Trabalho no ciclo {activeCycle.label}.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {!canAnswerSurveys && (
          <Alert>
            <ClipboardList className="h-4 w-4" />
            <AlertDescription>
              Os clientes do ciclo <strong>{activeCycle.label}</strong> estão sendo exibidos, mas as pesquisas de passagem de bastão só poderão ser respondidas quando um novo ciclo for definido como atual.
            </AlertDescription>
          </Alert>
        )}

        {canAnswerSurveys && pendingSurveyClients.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você possui <strong>{pendingSurveyClients.length}</strong> cliente(s) aguardando pesquisa de passagem de bastão do ciclo <strong>{activeCycle.label}</strong>.
            </AlertDescription>
          </Alert>
        )}
        {/* Pending surveys */}
        {pendingSurveyClients.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {canAnswerSurveys ? (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Pesquisas Pendentes ({pendingSurveyClients.length})
                </>
              ) : (
                <>
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  Meus Clientes - {activeCycle.label} ({pendingSurveyClients.length})
                </>
              )}
            </h3>
            <div className="grid gap-4">
              {pendingSurveyClients.map(client => {
                const clientGTMembers = getGTMembersByClient(client.id, activeCycleId);
                const consultants = clientGTMembers.filter(m => m.role === 'consultant');
                
                return (
                  <Card key={client.id} className={canAnswerSurveys ? "border-destructive/50" : "border-muted"}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            canAnswerSurveys ? "bg-destructive/10" : "bg-muted"
                          }`}>
                            <Building className={`h-5 w-5 ${canAnswerSurveys ? "text-destructive" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{client.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{activeCycle.label}</p>
                          </div>
                        </div>
                        {canAnswerSurveys && (
                          <Button 
                            size="sm"
                            onClick={() => setSurveyDialog({ 
                              clientId: client.id, 
                              clientName: client.name,
                              cycleId: activeCycleId,
                              cycleLabel: activeCycle?.label || ''
                            })}
                          >
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Responder
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="members" className="border-none">
                          <AccordionTrigger className="text-sm py-2">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Consultores do GT ({consultants.length})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {consultants.map(member => {
                                const memberProfile = getProfileByUserId(member.user_id);
                                return (
                                  <div key={member.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={memberProfile?.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(memberProfile?.display_name || null, memberProfile?.email || '')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{memberProfile?.display_name || memberProfile?.email}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Qualquer consultor pode responder a pesquisa. Após a primeira resposta, ela será marcada como concluída para todos.
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}


        {/* Completed surveys */}
        {completedSurveyClients.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Pesquisas Concluídas ({completedSurveyClients.length})
            </h3>
            <div className="grid gap-4">
              {completedSurveyClients.map(client => {
                const clientGTMembers = getGTMembersByClient(client.id, activeCycleId);
                const consultants = clientGTMembers.filter(m => m.role === 'consultant');
                const respondents = completedSurveysByClient[client.id] || [];
                const currentUserResponded = userCompletedSurveys.includes(client.id);
                
                return (
                  <Card key={client.id} className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {client.name}
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{activeCycle.label}</p>
                          </div>
                        </div>
                        {currentUserResponded && (
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => setSurveyDialog({ 
                              clientId: client.id, 
                              clientName: client.name,
                              cycleId: activeCycleId,
                              cycleLabel: activeCycle?.label || ''
                            })}
                          >
                            Editar minha resposta
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>{respondents.length}</strong> resposta(s) recebida(s) de consultores do GT
                        </p>
                      </div>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="members" className="border-none">
                          <AccordionTrigger className="text-sm py-2">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Consultores do GT ({consultants.length})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {consultants.map(member => {
                                const memberProfile = getProfileByUserId(member.user_id);
                                const hasResponded = respondents.includes(member.user_id);
                                return (
                                  <div key={member.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={memberProfile?.avatar_url || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(memberProfile?.display_name || null, memberProfile?.email || '')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{memberProfile?.display_name || memberProfile?.email}</span>
                                    {hasResponded && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="surveys" className="border-none">
                          <AccordionTrigger className="text-sm py-2">
                            <span className="flex items-center gap-2">
                              <ClipboardList className="h-4 w-4" />
                              Ver Todas as Respostas
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <GTHandoffSurveyResults clientId={client.id} cycleId={activeCycleId} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Leadership view
  const LeadershipView = () => {
    if (!activeCycle) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Não há ciclo anterior disponível.</p>
          </CardContent>
        </Card>
      );
    }

    if (leadershipClients.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma pesquisa de passagem de bastão foi respondida ainda para o ciclo {activeCycle.label}.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>{leadershipClients.length}</strong> cliente(s) com pesquisas respondidas no ciclo <strong>{activeCycle.label}</strong>.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {leadershipClients.map((item: any) => {
            const clientGTMembers = getGTMembersByClient(item.clientId, activeCycleId);
            
            return (
              <Card key={item.clientId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.clientName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {item.surveys.length} resposta(s) recebida(s)
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="respondents" className="border-none">
                      <AccordionTrigger className="text-sm py-2">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Quem respondeu ({item.surveys.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {item.surveys.map((survey: any, idx: number) => {
                            const memberProfile = getProfileByUserId(survey.userId);
                            return (
                              <div key={idx} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={memberProfile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(memberProfile?.display_name || null, memberProfile?.email || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{memberProfile?.display_name || memberProfile?.email}</span>
                                <CheckCircle2 className="h-3 w-3 text-primary" />
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="members" className="border-none">
                      <AccordionTrigger className="text-sm py-2">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Membros do GT ({clientGTMembers.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {clientGTMembers.map(member => {
                            const memberProfile = getProfileByUserId(member.user_id);
                            return (
                              <div key={member.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={memberProfile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(memberProfile?.display_name || null, memberProfile?.email || '')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{memberProfile?.display_name || memberProfile?.email}</span>
                                <Badge className={`text-xs ${getRoleBadgeVariant(member.role)}`}>
                                  {getRoleLabel(member.role)}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="surveys" className="border-none">
                      <AccordionTrigger className="text-sm py-2">
                        <span className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          Ver Todas as Respostas
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <GTHandoffSurveyResults clientId={item.clientId} cycleId={activeCycleId} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Passagem de Bastão
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isDemandasLeadership 
              ? 'Visualize todas as pesquisas de passagem de bastão respondidas'
              : 'Responda as pesquisas de passagem de bastão dos seus clientes do ciclo anterior'
            }
          </p>
          {activeCycle && (
            <p className="text-sm text-primary font-medium mt-1">
              Ciclo: {activeCycle.label}
            </p>
          )}
        </div>
      </div>

      {isDemandasLeadership ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas as Pesquisas</TabsTrigger>
            <TabsTrigger value="my-gts">Meus GTs</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <LeadershipView />
          </TabsContent>
          <TabsContent value="my-gts" className="mt-6">
            <ConsultantView />
          </TabsContent>
        </Tabs>
      ) : (
        <ConsultantView />
      )}

      {surveyDialog && (
        <GTHandoffSurvey
          clientId={surveyDialog.clientId}
          clientName={surveyDialog.clientName}
          cycleId={surveyDialog.cycleId}
          cycleLabel={surveyDialog.cycleLabel}
          open={!!surveyDialog}
          onClose={() => {
            setSurveyDialog(null);
            queryClient.invalidateQueries({ queryKey: ['handoff_surveys_by_client'] });
            queryClient.invalidateQueries({ queryKey: ['user_completed_handoff_surveys'] });
            queryClient.invalidateQueries({ queryKey: ['all_clients_with_handoff_surveys'] });
            queryClient.invalidateQueries({ queryKey: ['pending_handoff_surveys'] });
          }}
        />
      )}
    </div>
  );
}
