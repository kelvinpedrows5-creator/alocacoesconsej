import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, FileText, ClipboardList } from 'lucide-react';
import { useClients, GT_PROFILE_QUESTIONS } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GTHandoffSurvey, GTHandoffSurveyResults } from '@/components/GTHandoffSurvey';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function ClientsOverview() {
  const { clients, clientProfiles, gtMembers, getClientProfile, getGTMembersByClient } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { profile } = useAuthContext();
  const [surveyTarget, setSurveyTarget] = useState<{ clientId: string; clientName: string; cycleId: string; cycleLabel: string } | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_clients_view'],
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
      case 'director': return 'text-purple-700 bg-purple-100 border-purple-200';
      case 'manager': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'consultant': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      default: return '';
    }
  };

  // Find previous (non-current) visible cycles for handoff surveys
  const previousVisibleCycles = cycles.filter(c => c.is_visible && !c.is_current);

  // Check if user is a GT member for a given client in a given cycle
  const isUserInGT = (clientId: string, cycleId: string) => {
    if (!profile?.user_id) return false;
    return gtMembers.some(m => m.client_id === clientId && m.cycle_id === cycleId && m.user_id === profile.user_id);
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum cliente cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Clientes & Grupos de Trabalho</h2>
        <p className="text-sm text-muted-foreground">
          Informações sobre cada cliente para auxiliar na passagem de bastão e alocação
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {clients.map((client) => {
          const clientProfile = getClientProfile(client.id);
          const members = currentCycle ? getGTMembersByClient(client.id, currentCycle.id) : [];
          const director = members.find(m => m.role === 'director');
          const manager = members.find(m => m.role === 'manager');
          const consultants = members.filter(m => m.role === 'consultant');

          const answeredCount = clientProfile
            ? GT_PROFILE_QUESTIONS.filter(q => clientProfile[q.key as keyof typeof clientProfile]).length
            : 0;

          return (
            <Card key={client.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  {client.name}
                </CardTitle>
                {client.description && (
                  <p className="text-sm text-muted-foreground">{client.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* GT Composition */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Composição do GT
                  </div>
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-6">
                      Nenhum membro alocado no ciclo atual
                    </p>
                  ) : (
                    <div className="space-y-1.5 pl-6">
                      {[director, manager, ...consultants].filter(Boolean).map((member) => {
                        if (!member) return null;
                        const p = getProfileByUserId(member.user_id);
                        return (
                          <div key={member.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={p?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(p?.display_name || null, p?.email || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{p?.display_name || p?.email || 'Usuário'}</span>
                            <Badge variant="outline" className={`text-xs shrink-0 ${getRoleBadgeVariant(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Handoff Survey Button - show for previous cycles where user was in GT */}
                {previousVisibleCycles.map(cycle => {
                  if (!isUserInGT(client.id, cycle.id)) return null;
                  return (
                    <Button
                      key={cycle.id}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={() => setSurveyTarget({ clientId: client.id, clientName: client.name, cycleId: cycle.id, cycleLabel: cycle.label })}
                    >
                      <ClipboardList className="w-3 h-3" />
                      Preencher Pesquisa de Passagem — {cycle.label}
                    </Button>
                  );
                })}

                {/* Show existing handoff survey results for previous cycles */}
                {previousVisibleCycles.map(cycle => (
                  <GTHandoffSurveyResults key={cycle.id} clientId={client.id} cycleId={cycle.id} />
                ))}

                {/* Client Profile Info */}
                {clientProfile && answeredCount > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="profile" className="border-none">
                      <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          Perfil do Cliente ({answeredCount}/{GT_PROFILE_QUESTIONS.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-6">
                          {GT_PROFILE_QUESTIONS.map((q) => {
                            const answer = clientProfile[q.key as keyof typeof clientProfile];
                            if (!answer) return null;
                            return (
                              <div key={q.key} className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground">{q.label}</p>
                                <p className="text-sm text-foreground">{answer as string}</p>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {!clientProfile || answeredCount === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                    <FileText className="w-3 h-3" />
                    Perfil do cliente ainda não preenchido
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Handoff Survey Dialog */}
      {surveyTarget && (
        <GTHandoffSurvey
          clientId={surveyTarget.clientId}
          clientName={surveyTarget.clientName}
          cycleId={surveyTarget.cycleId}
          cycleLabel={surveyTarget.cycleLabel}
          open={!!surveyTarget}
          onClose={() => setSurveyTarget(null)}
        />
      )}
    </div>
  );
}
