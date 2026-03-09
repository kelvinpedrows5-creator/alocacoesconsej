import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Users, FileText, ClipboardList, Link as LinkIcon, Upload, ExternalLink, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClients, GT_PROFILE_QUESTIONS } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GTHandoffSurvey, GTHandoffSurveyResults } from '@/components/GTHandoffSurvey';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function ClientsOverview() {
  const { clients, clientProfiles, gtMembers, getClientProfile, getGTMembersByClient, getClientsByCycle, updateClient } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { profile, isAdmin } = useAuthContext();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [surveyTarget, setSurveyTarget] = useState<{ clientId: string; clientName: string; cycleId: string; cycleLabel: string } | null>(null);
  const [contractDialog, setContractDialog] = useState<{ clientId: string; clientName: string } | null>(null);
  const [contractType, setContractType] = useState<'link' | 'pdf'>('link');
  const [contractLink, setContractLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      case 'director': return 'text-purple-700 bg-purple-100 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700';
      case 'manager': return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      case 'consultant': return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700';
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

  // Set initial cycle
  useEffect(() => {
    if (currentCycle && !selectedCycleId) {
      setSelectedCycleId(currentCycle.id);
    }
  }, [currentCycle, selectedCycleId]);

  const activeCycleId = selectedCycleId || currentCycle?.id || '';
  const displayClients = activeCycleId ? getClientsByCycle(activeCycleId) : clients;
  const activeCycleLabel = cycles.find(c => c.id === activeCycleId)?.label || '';

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Clientes & Grupos de Trabalho</h2>
          <p className="text-sm text-muted-foreground">
            Informações sobre cada cliente para auxiliar na passagem de bastão e alocação
          </p>
        </div>
        <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecione um ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.filter(c => c.is_visible).map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.label} {cycle.is_current && '(Atual)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {displayClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum cliente vinculado a este ciclo.</p>
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        {displayClients.map((client) => {
          const clientProfile = getClientProfile(client.id);
          const members = activeCycleId ? getGTMembersByClient(client.id, activeCycleId) : [];
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
      )}

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
