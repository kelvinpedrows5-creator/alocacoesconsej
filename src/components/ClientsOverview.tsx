import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, FileText, Clock, BarChart3 } from 'lucide-react';
import { useClients, GT_PROFILE_QUESTIONS } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function ClientsOverview() {
  const { clients, clientProfiles, gtMembers, getClientProfile, getGTMembersByClient } = useClients();
  const { currentCycle } = useCycles();

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

  const getQuestionLabel = (key: string) => {
    const q = GT_PROFILE_QUESTIONS.find(q => q.key === key);
    return q?.label || key;
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
          const profile = getClientProfile(client.id);
          const members = currentCycle ? getGTMembersByClient(client.id, currentCycle.id) : [];
          const director = members.find(m => m.role === 'director');
          const manager = members.find(m => m.role === 'manager');
          const consultants = members.filter(m => m.role === 'consultant');

          // Count answered questions
          const answeredCount = profile
            ? GT_PROFILE_QUESTIONS.filter(q => profile[q.key as keyof typeof profile]).length
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

                {/* Client Profile Info */}
                {profile && answeredCount > 0 && (
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
                            const answer = profile[q.key as keyof typeof profile];
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

                {!profile || answeredCount === 0 ? (
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
    </div>
  );
}
