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
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useDemandsControl } from '@/hooks/useDemandsControl';
import { useLeadership } from '@/hooks/useLeadership';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export function ManagerClientsView() {
  const { user } = useAuthContext();
  const { clients, gtMembers, getGTMembersByClient, getClientsByCycle, addClient, addGTMember, removeGTMember } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { getMemberScores } = useDemandsControl();
  const { positions } = useLeadership();
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dispatchDialog, setDispatchDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchDescription, setDispatchDescription] = useState('');
  const [dispatchDeadlineDays, setDispatchDeadlineDays] = useState('1');
  const [dispatching, setDispatching] = useState(false);
  const [dispatches, setDispatches] = useState<any[]>([]);

  // New Client state
  const [newClientDialog, setNewClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [submissions, setSubmissions] = useState<{ user_id: string; helpers?: string[] }[]>([]);

  // Consultant allocation state for new client
  const [selectedConsultants, setSelectedConsultants] = useState<string[]>([]);

  // Add member to existing client
  const [addMemberDialog, setAddMemberDialog] = useState<{ clientId: string; clientName: string } | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('consultant');

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
      const deadlineDays = parseInt(dispatchDeadlineDays) || 1;
      const { data, error } = await supabase.from('demand_dispatches').insert({
        client_id: selectedClientId,
        title: dispatchTitle.trim(),
        description: dispatchDescription.trim() || null,
        deadline_hours: deadlineDays * 24, // Store as hours internally
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      setDispatches(prev => [data, ...prev]);
      toast.success('Demanda enviada ao GT com sucesso!');
      setDispatchDialog(false);
      setSelectedClientId('');
      setDispatchTitle('');
      setDispatchDescription('');
      setDispatchDeadlineDays('1');
    } catch (err: any) {
      toast.error('Erro ao enviar demanda: ' + err.message);
    } finally {
      setDispatching(false);
    }
  };

  // GT suggestion logic — no questions needed, based on member ranking
  const gtSuggestion = useMemo(() => {
    if (!showSuggestion) return null;

    // Default recommendation: 2 consultants
    const recommendedSize = 2;

    // Get ranked members
    const memberScores = getMemberScores(profiles, submissions);
    
    // Exclude leaders (directors/managers)
    const leaderUserIds = new Set(positions.map(p => p.user_id));
    
    // Filter out leaders and those already in too many GTs this cycle
    const memberGtCount = new Map<string, number>();
    gtMembers.filter(m => m.cycle_id === activeCycleId).forEach(m => {
      memberGtCount.set(m.user_id, (memberGtCount.get(m.user_id) || 0) + 1);
    });

    const suggestedMembers = memberScores
      .filter(m => !leaderUserIds.has(m.user_id))
      .filter(m => (memberGtCount.get(m.user_id) || 0) < 3)
      .slice(0, Math.max(recommendedSize, 3)); // Show top 3 at minimum

    return {
      recommendedSize,
      suggestedMembers,
    };
  }, [showSuggestion, profiles, submissions, getMemberScores, gtMembers, activeCycleId, positions]);

  // Available consultants (non-leaders, not already selected)
  const availableConsultants = useMemo(() => {
    const leaderUserIds = new Set(positions.map(p => p.user_id));
    return profiles.filter(p => !leaderUserIds.has(p.user_id));
  }, [profiles, positions]);

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    try {
      // Create client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ name: newClientName.trim(), description: newClientDesc.trim() || null })
        .select()
        .single();
      if (clientError) throw clientError;

      // Link to cycle
      if (activeCycleId) {
        await supabase.from('client_cycles').insert({
          client_id: newClient.id,
          cycle_id: activeCycleId,
        });
      }

      // Add manager itself to GT
      if (user && activeCycleId) {
        await supabase.from('gt_members').insert({
          client_id: newClient.id,
          user_id: user.id,
          role: 'manager',
          cycle_id: activeCycleId,
        });
      }

      // Add selected consultants
      if (selectedConsultants.length > 0 && activeCycleId) {
        const consultantInserts = selectedConsultants.map(userId => ({
          client_id: newClient.id,
          user_id: userId,
          role: 'consultant',
          cycle_id: activeCycleId,
        }));
        await supabase.from('gt_members').insert(consultantInserts);
      }

      toast.success('Cliente criado com sucesso!');
      setNewClientDialog(false);
      setNewClientName('');
      setNewClientDesc('');
      setSelectedConsultants([]);
      setShowSuggestion(false);
      // Reload page data
      window.location.reload();
    } catch (err: any) {
      toast.error('Erro ao criar cliente: ' + err.message);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleRemoveGTMember = (memberId: string) => {
    removeGTMember(memberId);
  };

  const handleAddMember = () => {
    if (!addMemberDialog || !addMemberUserId || !activeCycleId) return;
    addGTMember({
      client_id: addMemberDialog.clientId,
      user_id: addMemberUserId,
      role: addMemberRole,
      cycle_id: activeCycleId,
    });
    setAddMemberDialog(null);
    setAddMemberUserId('');
    setAddMemberRole('consultant');
  };

  const toggleConsultant = (userId: string) => {
    setSelectedConsultants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : prev.length < 3 ? [...prev, userId] : prev
    );
  };

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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Equipe do GT ({members.length})
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setAddMemberDialog({ clientId: client.id, clientName: client.name })}
                        >
                          <UserPlus className="w-3 h-3" />
                          Adicionar
                        </Button>
                      </div>
                      <div className="space-y-1 pl-6">
                        {members.map(member => {
                          const p = getProfileByUserId(member.user_id);
                          return (
                            <div key={member.id} className="flex items-center gap-2 group">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={p?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(p?.display_name || null, p?.email || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate flex-1">{p?.display_name || p?.email || 'Membro'}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeClass(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </Badge>
                              {member.user_id !== user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={() => handleRemoveGTMember(member.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              )}
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
                                  <span>{Math.round(d.deadline_hours / 24)} dia{Math.round(d.deadline_hours / 24) !== 1 ? 's' : ''} para execução</span>
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
                Tempo para execução (dias)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={dispatchDeadlineDays}
                  onChange={e => setDispatchDeadlineDays(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">dia{parseInt(dispatchDeadlineDays) !== 1 ? 's' : ''}</span>
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
          setSelectedConsultants([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Novo Cliente
            </DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente e, opcionalmente, aloque consultores ao GT.
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

            {/* Consultant Allocation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Consultores do GT (opcional)
                </h3>
                {!showSuggestion && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => setShowSuggestion(true)}
                  >
                    <Sparkles className="w-3 h-3" />
                    Sugestão Automática
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione até 3 consultores para o grupo de trabalho. Você será adicionado automaticamente como gerente.
              </p>

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
                      Recomendação: <strong>{gtSuggestion.recommendedSize} consultor{gtSuggestion.recommendedSize > 1 ? 'es' : ''}</strong> para este GT.
                      Clique nos membros abaixo para selecioná-los.
                    </p>
                    {gtSuggestion.suggestedMembers.length > 0 ? (
                      <div className="space-y-2">
                        {gtSuggestion.suggestedMembers.map((member, idx) => {
                          const isSelected = selectedConsultants.includes(member.user_id);
                          return (
                            <button
                              key={member.user_id}
                              type="button"
                              onClick={() => toggleConsultant(member.user_id)}
                              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 ring-1 ring-primary/30'
                                  : 'bg-background/60 hover:bg-background/80'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {idx + 1}
                              </div>
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={member.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(member.display_name, member.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 text-left">
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
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum membro disponível para sugestão.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Manual selection */}
              {!showSuggestion && (
                <Select
                  value=""
                  onValueChange={(val) => {
                    if (val && !selectedConsultants.includes(val) && selectedConsultants.length < 3) {
                      setSelectedConsultants(prev => [...prev, val]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar consultor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConsultants
                      .filter(p => !selectedConsultants.includes(p.user_id) && p.user_id !== user?.id)
                      .map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.display_name || p.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              {/* Selected consultants */}
              {selectedConsultants.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Selecionados ({selectedConsultants.length}/3):</p>
                  {selectedConsultants.map(userId => {
                    const p = getProfileByUserId(userId);
                    return (
                      <div key={userId} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/30">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(p?.display_name || null, p?.email || '')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">{p?.display_name || p?.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setSelectedConsultants(prev => prev.filter(id => id !== userId))}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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

      {/* Add Member to GT Dialog */}
      <Dialog open={!!addMemberDialog} onOpenChange={(open) => !open && setAddMemberDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Adicionar Membro — {addMemberDialog?.clientName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Membro</label>
              <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o membro" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter(p => {
                      if (!addMemberDialog) return false;
                      const existing = getGTMembersByClient(addMemberDialog.clientId, activeCycleId);
                      return !existing.some(m => m.user_id === p.user_id);
                    })
                    .map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.display_name || p.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Função</label>
              <Select value={addMemberRole} onValueChange={setAddMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant">Consultor</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="director">Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddMemberDialog(null)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember} disabled={!addMemberUserId}>
                <Check className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
