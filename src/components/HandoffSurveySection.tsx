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

  // Find previous cycle for handoff survey notification
  const visibleCycles = cycles.filter(c => c.is_visible).sort((a, b) => b.value.localeCompare(a.value));
  const currentCycleIndex = visibleCycles.findIndex(c => c.id === currentCycle?.id);
  const previousCycle = currentCycleIndex >= 0 && currentCycleIndex < visibleCycles.length - 1 
    ? visibleCycles[currentCycleIndex + 1] 
    : null;

  useEffect(() => {
    if (previousCycle && !selectedCycleId) {
      setSelectedCycleId(previousCycle.id);
    }
  }, [previousCycle, selectedCycleId]);

  const activeCycleId = selectedCycleId || previousCycle?.id || '';
  const activeCycle = cycles.find(c => c.id === activeCycleId);

  // Get clients from selected cycle where user was in GT
  const cycleClients = activeCycleId 
    ? getClientsByCycle(activeCycleId).filter(client => isUserInGT(client.id, activeCycleId))
    : [];

  // Check which surveys are already completed for selected cycle
  const { data: completedSurveys = [] } = useQuery({
    queryKey: ['completed_handoff_surveys_section', activeCycleId, profile?.user_id],
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

  const pendingSurveyClients = cycleClients.filter(
    client => !completedSurveys.includes(client.id)
  );

  const completedSurveyClients = cycleClients.filter(
    client => completedSurveys.includes(client.id)
  );

  // Filter cycles to show only those before the current cycle
  const eligibleCycles = cycles.filter(c => {
    if (!currentCycle) return c.is_visible;
    return c.is_visible && c.value < currentCycle.value;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Passagem de Bastão
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Responda as pesquisas de passagem de bastão dos seus clientes anteriores
          </p>
        </div>
        <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o ciclo" />
          </SelectTrigger>
          <SelectContent>
            {eligibleCycles.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pendingSurveyClients.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você possui <strong>{pendingSurveyClients.length}</strong> cliente(s) aguardando pesquisa de passagem de bastão neste ciclo.
          </AlertDescription>
        </Alert>
      )}

      {cycleClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Você não estava alocado em nenhum Grupo de Trabalho neste ciclo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending surveys */}
          {pendingSurveyClients.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Pesquisas Pendentes ({pendingSurveyClients.length})
              </h3>
              <div className="grid gap-4">
                {pendingSurveyClients.map(client => {
                  const clientGTMembers = getGTMembersByClient(client.id, activeCycleId);
                  
                  return (
                    <Card key={client.id} className="border-destructive/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                              <Building className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{client.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{activeCycle?.label}</p>
                            </div>
                          </div>
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
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible>
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
                              <p className="text-sm text-muted-foreground">{activeCycle?.label}</p>
                            </div>
                          </div>
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
                            Editar
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible>
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
                                Ver Respostas do GT
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
            queryClient.invalidateQueries({ queryKey: ['completed_handoff_surveys_section'] });
          }}
        />
      )}
    </div>
  );
}
