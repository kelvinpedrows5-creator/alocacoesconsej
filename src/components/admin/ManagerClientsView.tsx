import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Users,
  ArrowUpDown,
  Play,
  Clock,
  Check,
  Search,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useClients, GT_PROFILE_QUESTIONS } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useDemandsControl } from '@/hooks/useDemandsControl';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function ManagerClientsView() {
  const { user } = useAuthContext();
  const { clients, gtMembers, getGTMembersByClient, getClientsByCycle, addClient } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { getMemberScores } = useDemandsControl();
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dispatchDialog, setDispatchDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchDescription, setDispatchDescription] = useState('');
  const [dispatchDeadline, setDispatchDeadline] = useState('24');
  const [dispatching, setDispatching] = useState(false);
  const [dispatches, setDispatches] = useState<any[]>([]);

  // New Client state
  const [newClientDialog, setNewClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [newClientProfileAnswers, setNewClientProfileAnswers] = useState<Record<string, string>>({});
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [submissions, setSubmissions] = useState<{ user_id: string; helpers?: string[] }[]>([]);

  useEffect(() => {
    if (currentCycle && !selectedCycleId) setSelectedCycleId(currentCycle.id);
  }, [currentCycle, selectedCycleId]);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, dispatchesRes, subsRes, helpersRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, email, avatar_url'),
        supabase.from('demand_dispatches').select('*').order('created_at', { ascending: false }),
        supabase.from('demand_submissions').select('user_id, id').eq('status', 'evaluated'),
        supabase.from('demand_submission_helpers').select('submission_id, helper_user_id'),
      ]);
      setProfiles(profilesRes.data || []);
      setDispatches(dispatchesRes.data || []);
      
      const allHelpers = helpersRes.data || [];
      const subs = (subsRes.data || []).map((s: any) => ({
        user_id: s.user_id,
        helpers: allHelpers.filter((h: any) => h.submission_id === s.id).map((h: any) => h.helper_user_id),
      }));
      setSubmissions(subs);
    };
    fetchData();
  }, []);

  const activeCycleId = selectedCycleId || currentCycle?.id || '';

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

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'director': return 'text-purple-700 bg-purple-100 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700';
      case 'manager': return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      case 'consultant': return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700';
      default: return '';
    }
  };

  // Filter clients where this manager is in the GT
  const cycleClients = getClientsByCycle(activeCycleId);
  const myClients = cycleClients.filter(client =>
    gtMembers.some(
      m => m.client_id === client.id && m.cycle_id === activeCycleId && m.user_id === user?.id
    )
  );

  // Search + sort
  const filteredClients = myClients
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const handleDispatch = async () => {
    if (!selectedClientId || !dispatchTitle.trim() || !user) return;
    setDispatching(true);
    try {
      const { data, error } = await supabase.from('demand_dispatches').insert({
        client_id: selectedClientId,
        title: dispatchTitle.trim(),
        description: dispatchDescription.trim() || null,
        deadline_hours: parseInt(dispatchDeadline) || 24,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      setDispatches(prev => [data, ...prev]);
      toast.success('Demanda enviada ao GT com sucesso!');
      setDispatchDialog(false);
      setSelectedClientId('');
      setDispatchTitle('');
      setDispatchDescription('');
      setDispatchDeadline('24');
    } catch (err: any) {
      toast.error('Erro ao enviar demanda: ' + err.message);
    } finally {
      setDispatching(false);
    }
  };

  // GT suggestion logic based on client profile answers
  const gtSuggestion = useMemo(() => {
    if (!showSuggestion || Object.keys(newClientProfileAnswers).length < 5) return null;

    const answers = newClientProfileAnswers;
    
    // Determine recommended team size based on complexity and contact frequency
    let recommendedSize = 1; // minimum consultants
    const complexity = answers['question_5'];
    const contactFreq = answers['question_2'];
    const demandStyle = answers['question_3'];
    
    if (complexity === 'Alta complexidade - exige especialistas') recommendedSize = 3;
    else if (complexity === 'Média complexidade - exige experiência') recommendedSize = 2;
    else if (complexity === 'Variável - depende do projeto') recommendedSize = 2;
    
    if (contactFreq === 'Alta - contato diário' && recommendedSize < 3) recommendedSize++;
    if (demandStyle === 'Demandas emergenciais e urgentes' && recommendedSize < 3) recommendedSize++;
    if (recommendedSize > 3) recommendedSize = 3;

    // Get ranked members (from useDemandsControl)
    const memberScores = getMemberScores(profiles, submissions);
    
    // Filter out those already in too many GTs this cycle
    const memberGtCount = new Map<string, number>();
    gtMembers.filter(m => m.cycle_id === activeCycleId).forEach(m => {
      memberGtCount.set(m.user_id, (memberGtCount.get(m.user_id) || 0) + 1);
    });

    const suggestedMembers = memberScores
      .filter(m => (memberGtCount.get(m.user_id) || 0) < 3) // not overloaded
      .slice(0, recommendedSize);

    return {
      recommendedSize,
      suggestedMembers,
    };
  }, [showSuggestion, newClientProfileAnswers, profiles, submissions, getMemberScores, gtMembers, activeCycleId]);

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    try {
      addClient({
        name: newClientName.trim(),
        description: newClientDesc.trim() || undefined,
        cycleId: activeCycleId || undefined,
      });
      toast.success('Cliente criado com sucesso!');
      setNewClientDialog(false);
      setNewClientName('');
      setNewClientDesc('');
      setNewClientProfileAnswers({});
      setShowSuggestion(false);
    } catch (err: any) {
      toast.error('Erro ao criar cliente: ' + err.message);
    } finally {
      setCreatingClient(false);
    }
  };

  const answeredCount = Object.keys(newClientProfileAnswers).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Meus Clientes
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Clientes sob sua responsabilidade como Gerente de Demandas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Button variant="outline" onClick={() => setNewClientDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
          <Button onClick={() => setDispatchDialog(true)} className="gap-2">
            <Play className="w-4 h-4" />
            Rodar Demanda
          </Button>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortAsc(!sortAsc)}
          title={sortAsc ? 'A-Z' : 'Z-A'}
        >
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {myClients.length === 0
                ? 'Você não está alocado em nenhum GT neste ciclo.'
                : 'Nenhum cliente encontrado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map(client => {
            const members = getGTMembersByClient(client.id, activeCycleId);
            const clientDispatches = dispatches.filter(d => d.client_id === client.id);

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      {client.name}
                    </CardTitle>
                    {client.description && (
                      <CardDescription>{client.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="w-4 h-4" />
                        Equipe do GT ({members.length})
                      </div>
                      <div className="space-y-1 pl-6">
                        {members.map(member => {
                          const p = getProfileByUserId(member.user_id);
                          return (
                            <div key={member.id} className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={p?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(p?.display_name || null, p?.email || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate">{p?.display_name || p?.email || 'Membro'}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeClass(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {clientDispatches.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Play className="w-4 h-4" />
                          Demandas Rodadas ({clientDispatches.length})
                        </div>
                        <div className="space-y-1 pl-6">
                          {clientDispatches.slice(0, 3).map(d => (
                            <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{d.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{d.deadline_hours}h para execução</span>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  d.status === 'completed'
                                    ? 'bg-success/20 text-success'
                                    : 'bg-warning/20 text-warning'
                                }
                              >
                                {d.status === 'completed' ? 'Concluída' : 'Pendente'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rodar Demanda Dialog */}
      <Dialog open={dispatchDialog} onOpenChange={setDispatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Rodar Demanda
            </DialogTitle>
            <DialogDescription>
              Escolha o GT, descreva a demanda e defina o prazo de execução.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Grupo de Trabalho (Cliente)</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o GT" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Demanda</label>
              <Input
                placeholder="Título da demanda..."
                value={dispatchTitle}
                onChange={e => setDispatchTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição (opcional)</label>
              <Textarea
                placeholder="Detalhes sobre a demanda..."
                value={dispatchDescription}
                onChange={e => setDispatchDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Tempo para execução (horas)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={dispatchDeadline}
                  onChange={e => setDispatchDeadline(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDispatchDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDispatch} disabled={!selectedClientId || !dispatchTitle.trim() || dispatching}>
                <Check className="w-4 h-4 mr-2" />
                {dispatching ? 'Enviando...' : 'Enviar Demanda'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo Cliente Dialog */}
      <Dialog open={newClientDialog} onOpenChange={(open) => {
        setNewClientDialog(open);
        if (!open) {
          setShowSuggestion(false);
          setNewClientProfileAnswers({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Novo Cliente
            </DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente e responda o perfil para gerar sugestões de equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do Cliente *</label>
              <Input
                placeholder="Nome da empresa..."
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição (opcional)</label>
              <Textarea
                placeholder="Breve descrição do cliente..."
                value={newClientDesc}
                onChange={e => setNewClientDesc(e.target.value)}
                rows={2}
              />
            </div>

            {/* Client Profile Questions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Perfil do Cliente ({answeredCount}/{GT_PROFILE_QUESTIONS.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Responda pelo menos 5 perguntas para gerar a sugestão de equipe do GT.
              </p>
              {GT_PROFILE_QUESTIONS.map((q) => (
                <div key={q.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{q.label}</label>
                  <Select
                    value={newClientProfileAnswers[q.key] || ''}
                    onValueChange={(val) =>
                      setNewClientProfileAnswers(prev => ({ ...prev, [q.key]: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Generate Suggestion Button */}
            {answeredCount >= 5 && !showSuggestion && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowSuggestion(true)}
              >
                <Sparkles className="w-4 h-4" />
                Gerar Sugestão de Equipe
              </Button>
            )}

            {/* Suggestion Panel */}
            {showSuggestion && gtSuggestion && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Sugestão de Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Recomendação: <strong>{gtSuggestion.recommendedSize} consultor{gtSuggestion.recommendedSize > 1 ? 'es' : ''}</strong> para este GT,
                    além de 1 diretor e 1 gerente.
                  </p>
                  {gtSuggestion.suggestedMembers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Membros sugeridos (por ranking de desempenho):</p>
                      {gtSuggestion.suggestedMembers.map((member, idx) => (
                        <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-background/60">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {idx + 1}
                          </div>
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(member.display_name, member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.display_name || member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.demands_count} demanda{member.demands_count !== 1 ? 's' : ''} • Média: {member.average_score.toFixed(1)}
                            </p>
                          </div>
                          <Badge className={
                            member.average_score >= 7
                              ? 'bg-success/20 text-success'
                              : member.average_score >= 4
                              ? 'bg-warning/20 text-warning'
                              : 'bg-destructive/20 text-destructive'
                          }>
                            <Star className="w-3 h-3 mr-1" />
                            {member.average_score.toFixed(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {gtSuggestion.suggestedMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum membro disponível para sugestão.</p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setNewClientDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClient} disabled={!newClientName.trim() || creatingClient}>
                <Check className="w-4 h-4 mr-2" />
                {creatingClient ? 'Criando...' : 'Criar Cliente'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
