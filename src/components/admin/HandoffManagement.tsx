import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, ClipboardList, CheckCircle2, AlertCircle, BookOpen, Eye } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GTHandoffSurveyResults } from '@/components/GTHandoffSurvey';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function HandoffManagement() {
  const { clients, gtMembers, getGTMembersByClient, getClientsByCycle } = useClients();
  const { cycles, currentCycle } = useCycles();

  const visibleCycles = cycles.filter(c => c.is_visible).sort((a, b) => b.value.localeCompare(a.value));
  const currentCycleIndex = visibleCycles.findIndex(c => c.id === currentCycle?.id);
  const previousCycle = currentCycleIndex >= 0 && currentCycleIndex < visibleCycles.length - 1
    ? visibleCycles[currentCycleIndex + 1]
    : null;

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_admin_handoff'],
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

  // All clients from previous cycle with their GT consultants
  const previousCycleClients = previousCycle ? getClientsByCycle(previousCycle.id) : [];

  // Fetch all handoff surveys for previous cycle
  const { data: allSurveys = [] } = useQuery({
    queryKey: ['admin_handoff_surveys', previousCycle?.id],
    queryFn: async () => {
      if (!previousCycle) return [];
      const { data, error } = await supabase
        .from('gt_handoff_surveys')
        .select('client_id, user_id, created_at')
        .eq('cycle_id', previousCycle.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!previousCycle,
  });

  // Group surveys by client
  const surveysByClient: Record<string, string[]> = {};
  allSurveys.forEach(s => {
    if (!surveysByClient[s.client_id]) surveysByClient[s.client_id] = [];
    surveysByClient[s.client_id].push(s.user_id);
  });

  // Fetch all read confirmations for current cycle
  const { data: allReadConfirmations = [] } = useQuery({
    queryKey: ['admin_read_confirmations', currentCycle?.id],
    queryFn: async () => {
      if (!currentCycle) return [];
      const { data, error } = await supabase
        .from('handoff_read_confirmations')
        .select('*')
        .eq('cycle_id', currentCycle.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCycle,
  });

  // Current cycle clients with their GT consultants (for reading section)
  const currentCycleClients = currentCycle ? getClientsByCycle(currentCycle.id) : [];

  // Separate previous cycle clients into pending/completed surveys
  const clientsWithPendingSurvey = previousCycleClients.filter(client => {
    const respondents = surveysByClient[client.id] || [];
    return respondents.length === 0;
  });
  const clientsWithCompletedSurvey = previousCycleClients.filter(client => {
    const respondents = surveysByClient[client.id] || [];
    return respondents.length > 0;
  });

  // For reading: check which current cycle consultants have confirmed reading
  const getReadStatusForClient = (clientId: string) => {
    const currentGTMembers = getGTMembersByClient(clientId, currentCycle?.id || '');
    const consultants = currentGTMembers.filter(m => m.role === 'consultant');
    const confirmations = allReadConfirmations.filter((rc: any) => rc.client_id === clientId);

    const readStatus = consultants.map(consultant => {
      const confirmation = confirmations.find((rc: any) => rc.user_id === consultant.user_id);
      return {
        userId: consultant.user_id,
        confirmedTop: confirmation?.confirmed_top || false,
        confirmedBottom: confirmation?.confirmed_bottom || false,
        fullyConfirmed: (confirmation?.confirmed_top && confirmation?.confirmed_bottom) || false,
      };
    });

    return { consultants, readStatus, allConfirmed: readStatus.length > 0 && readStatus.every(r => r.fullyConfirmed) };
  };

  // Separate current cycle clients by reading status
  const clientsWithPendingRead = currentCycleClients.filter(client => {
    // Only include if there's a survey from previous cycle to read
    const hasSurvey = (surveysByClient[client.id] || []).length > 0;
    if (!hasSurvey) return false;
    const { allConfirmed, consultants } = getReadStatusForClient(client.id);
    return consultants.length > 0 && !allConfirmed;
  });
  const clientsWithCompletedRead = currentCycleClients.filter(client => {
    const hasSurvey = (surveysByClient[client.id] || []).length > 0;
    if (!hasSurvey) return false;
    const { allConfirmed, consultants } = getReadStatusForClient(client.id);
    return consultants.length > 0 && allConfirmed;
  });

  const renderClientCard = (client: any, cycleId: string, type: 'survey' | 'read') => {
    const members = getGTMembersByClient(client.id, cycleId);
    const consultants = members.filter(m => m.role === 'consultant');
    const respondents = surveysByClient[client.id] || [];

    if (type === 'survey') {
      const isCompleted = respondents.length > 0;
      return (
        <Card key={client.id} className={isCompleted ? 'border-primary/30' : 'border-destructive/30'}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  <Building className={`h-5 w-5 ${isCompleted ? 'text-primary' : 'text-destructive'}`} />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {client.name}
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{previousCycle?.label}</p>
                </div>
              </div>
              <Badge variant={isCompleted ? 'default' : 'destructive'}>
                {isCompleted ? `${respondents.length} resposta(s)` : 'Pendente'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="consultants" className="border-none">
                <AccordionTrigger className="text-sm py-2">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Consultores ({consultants.length})
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {consultants.map(member => {
                      const p = getProfileByUserId(member.user_id);
                      const hasResponded = respondents.includes(member.user_id);
                      return (
                        <div key={member.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={p?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(p?.display_name || null, p?.email || '')}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{p?.display_name || p?.email}</span>
                          {hasResponded && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
              {isCompleted && (
                <AccordionItem value="responses" className="border-none">
                  <AccordionTrigger className="text-sm py-2">
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Respostas
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <GTHandoffSurveyResults clientId={client.id} cycleId={cycleId} />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>
      );
    }

    // Read type
    const { readStatus } = getReadStatusForClient(client.id);
    const allConfirmed = readStatus.every(r => r.fullyConfirmed);
    const confirmedCount = readStatus.filter(r => r.fullyConfirmed).length;

    return (
      <Card key={client.id} className={allConfirmed ? 'border-primary/30' : 'border-amber-500/30'}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${allConfirmed ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
                <BookOpen className={`h-5 w-5 ${allConfirmed ? 'text-primary' : 'text-amber-600'}`} />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {client.name}
                  {allConfirmed && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Ciclo {currentCycle?.label}</p>
              </div>
            </div>
            <Badge variant={allConfirmed ? 'default' : 'outline'} className={!allConfirmed ? 'text-amber-600 border-amber-500/30 bg-amber-500/10' : ''}>
              {confirmedCount}/{readStatus.length} lidos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {readStatus.map(status => {
              const p = getProfileByUserId(status.userId);
              return (
                <div key={status.userId} className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 ${status.fullyConfirmed ? 'bg-primary/10' : 'bg-muted/50'}`}>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={p?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(p?.display_name || null, p?.email || '')}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{p?.display_name || p?.email}</span>
                  {status.fullyConfirmed ? (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  ) : status.confirmedTop ? (
                    <Badge variant="outline" className="text-xs h-5 px-1">Parcial</Badge>
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!previousCycle && !currentCycle) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Não há ciclos configurados para passagem de bastão.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Passagem de Bastão
        </h3>
        <p className="text-sm text-muted-foreground">
          Acompanhe as pesquisas de passagem de bastão e confirmações de leitura dos consultores
        </p>
      </div>

      <Tabs defaultValue="surveys">
        <TabsList>
          <TabsTrigger value="surveys" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            A Responder
            {clientsWithPendingSurvey.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{clientsWithPendingSurvey.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reads" className="gap-2">
            <BookOpen className="h-4 w-4" />
            A Ler
            {clientsWithPendingRead.length > 0 && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs text-amber-600 border-amber-500/30">{clientsWithPendingRead.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="space-y-4 mt-4">
          {previousCycle ? (
            <>
              <Alert>
                <ClipboardList className="h-4 w-4" />
                <AlertDescription>
                  Passagens de bastão do ciclo <strong>{previousCycle.label}</strong>: 
                  <strong> {clientsWithCompletedSurvey.length}</strong> respondidas, 
                  <strong> {clientsWithPendingSurvey.length}</strong> pendentes de {previousCycleClients.length} GTs.
                </AlertDescription>
              </Alert>

              {clientsWithPendingSurvey.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Pendentes ({clientsWithPendingSurvey.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {clientsWithPendingSurvey.map(client => renderClientCard(client, previousCycle.id, 'survey'))}
                  </div>
                </div>
              )}

              {clientsWithCompletedSurvey.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Respondidas ({clientsWithCompletedSurvey.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {clientsWithCompletedSurvey.map(client => renderClientCard(client, previousCycle.id, 'survey'))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Não há ciclo anterior disponível.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reads" className="space-y-4 mt-4">
          {currentCycle ? (
            <>
              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  Confirmações de leitura para o ciclo <strong>{currentCycle.label}</strong>: 
                  <strong> {clientsWithCompletedRead.length}</strong> completas, 
                  <strong> {clientsWithPendingRead.length}</strong> pendentes.
                </AlertDescription>
              </Alert>

              {clientsWithPendingRead.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    Leitura Pendente ({clientsWithPendingRead.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {clientsWithPendingRead.map(client => renderClientCard(client, currentCycle.id, 'read'))}
                  </div>
                </div>
              )}

              {clientsWithCompletedRead.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Leitura Confirmada ({clientsWithCompletedRead.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {clientsWithCompletedRead.map(client => renderClientCard(client, currentCycle.id, 'read'))}
                  </div>
                </div>
              )}

              {clientsWithPendingRead.length === 0 && clientsWithCompletedRead.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhum GT com passagem de bastão para leitura neste ciclo.</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Não há ciclo atual definido.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
