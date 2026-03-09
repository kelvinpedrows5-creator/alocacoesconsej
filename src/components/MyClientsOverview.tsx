import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, FileText, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients, GT_PROFILE_QUESTIONS } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GTHandoffSurvey, GTHandoffSurveyResults } from '@/components/GTHandoffSurvey';
import { Button } from '@/components/ui/button';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function MyClientsOverview() {
  const { clients, clientProfiles, gtMembers, getClientProfile, getGTMembersByClient, getClientsByCycle } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { profile } = useAuthContext();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [surveyTarget, setSurveyTarget] = useState<{ clientId: string; clientName: string; cycleId: string; cycleLabel: string } | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_my_clients'],
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
      case 'director': return 'Diretor de Demandas';
      case 'manager': return 'Gerente de Demandas';
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

  const previousVisibleCycles = cycles.filter(c => c.is_visible && !c.is_current);

  const isUserInGT = (clientId: string, cycleId: string) => {
    if (!profile?.user_id) return false;
    return gtMembers.some(m => m.client_id === clientId && m.cycle_id === cycleId && m.user_id === profile.user_id);
  };

  const activeCycleId = selectedCycleId || currentCycle?.id || '';
  const activeCycleLabel = cycles.find(c => c.id === activeCycleId)?.label || '';

  // Filter clients to only those where the user is a GT member in the selected cycle
  const cycleClients = getClientsByCycle(activeCycleId);
  const myClients = cycleClients.filter(client => isUserInGT(client.id, activeCycleId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Meus Clientes
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Grupos de Trabalho nos quais você está alocado
          </p>
        </div>
        <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.filter(c => c.is_visible).map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {myClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Você não está alocado em nenhum Grupo de Trabalho neste ciclo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {myClients.map(client => {
            const clientGTMembers = getGTMembersByClient(client.id, activeCycleId);
            const clientProfile = getClientProfile(client.id);

            return (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        {client.name}
                      </CardTitle>
                      {client.description && (
                        <p className="text-sm text-muted-foreground mt-1">{client.description}</p>
                      )}
                    </div>
                    {client.contract_scope_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(client.contract_scope_url!, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {client.contract_scope_type === 'pdf' ? 'Ver PDF' : 'Ver Escopo'}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* GT Members */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Equipe do GT ({clientGTMembers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {clientGTMembers.map(member => {
                        const memberProfile = getProfileByUserId(member.user_id);
                        return (
                          <div key={member.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={memberProfile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(memberProfile?.display_name || null, memberProfile?.email || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{memberProfile?.display_name || memberProfile?.email || 'Membro'}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 w-fit ${getRoleBadgeVariant(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Client Profile */}
                  {clientProfile && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="profile">
                        <AccordionTrigger className="text-sm font-semibold">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Perfil do Cliente
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid gap-3">
                            {GT_PROFILE_QUESTIONS.map((q, idx) => {
                              const key = `question_${idx + 1}` as keyof typeof clientProfile;
                              const answer = clientProfile[key];
                              if (!answer) return null;
                              return (
                                <div key={idx} className="bg-muted/30 rounded-lg p-3">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">{q}</p>
                                  <p className="text-sm">{answer as string}</p>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {/* Handoff Surveys */}
                  {previousVisibleCycles.length > 0 && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="handoff">
                        <AccordionTrigger className="text-sm font-semibold">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Passagem de Bastão
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {previousVisibleCycles.map(cycle => {
                              const canFill = isUserInGT(client.id, cycle.id);
                              return (
                                <div key={cycle.id} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{cycle.label}</span>
                                    {canFill && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSurveyTarget({
                                          clientId: client.id,
                                          clientName: client.name,
                                          cycleId: cycle.id,
                                          cycleLabel: cycle.label,
                                        })}
                                      >
                                        Preencher
                                      </Button>
                                    )}
                                  </div>
                                  <GTHandoffSurveyResults clientId={client.id} cycleId={cycle.id} />
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {surveyTarget && (
        <GTHandoffSurvey
          clientId={surveyTarget.clientId}
          clientName={surveyTarget.clientName}
          cycleId={surveyTarget.cycleId}
          cycleLabel={surveyTarget.cycleLabel}
          onClose={() => setSurveyTarget(null)}
        />
      )}
    </div>
  );
}
