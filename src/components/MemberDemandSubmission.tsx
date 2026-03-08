import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Users, Check, Clock, CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface GtEntry {
  user_id: string;
  client_id: string;
  cycle_id: string;
}

interface ClientData {
  id: string;
  name: string;
}

interface Submission {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  performed_at: string | null;
  gt_client_id: string | null;
  helpers: string[];
}

export function MemberDemandSubmission() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [gtEntries, setGtEntries] = useState<GtEntry[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [performedAt, setPerformedAt] = useState<Date | undefined>(undefined);
  const [selectedGtClientId, setSelectedGtClientId] = useState<string>('');
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // User's GTs (unique client_ids)
  const userGtClientIds = useMemo(() => {
    const ids = gtEntries.filter((g) => g.user_id === user?.id).map((g) => g.client_id);
    return [...new Set(ids)];
  }, [gtEntries, user]);

  const userGtClients = useMemo(() => {
    return clients.filter((c) => userGtClientIds.includes(c.id));
  }, [clients, userGtClientIds]);

  // Members of the selected GT (excluding current user)
  const gtMembersForSelectedClient = useMemo(() => {
    if (!selectedGtClientId || !user) return [];
    const memberIds = gtEntries
      .filter((g) => g.client_id === selectedGtClientId && g.user_id !== user.id)
      .map((g) => g.user_id);
    return [...new Set(memberIds)];
  }, [gtEntries, selectedGtClientId, user]);

  const gtProfiles = useMemo(() => {
    return profiles.filter((p) => gtMembersForSelectedClient.includes(p.user_id));
  }, [profiles, gtMembersForSelectedClient]);

  // Reset helpers when GT changes
  useEffect(() => {
    setSelectedHelpers([]);
  }, [selectedGtClientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsRes, profilesRes, helpersRes, gtRes, clientsRes] = await Promise.all([
        supabase.from('demand_submissions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name, email, avatar_url'),
        supabase.from('demand_submission_helpers').select('*'),
        supabase.from('gt_members').select('user_id, client_id, cycle_id'),
        supabase.from('clients').select('id, name'),
      ]);

      setProfiles(profilesRes.data || []);
      setGtEntries(gtRes.data || []);
      setClients(clientsRes.data || []);

      const allHelpers = helpersRes.data || [];
      const subs: Submission[] = (submissionsRes.data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        created_at: s.created_at,
        performed_at: s.performed_at || null,
        gt_client_id: s.gt_client_id || null,
        helpers: allHelpers.filter((h: any) => h.submission_id === s.id).map((h: any) => h.helper_user_id),
      }));
      setSubmissions(subs);
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);
  const getClientName = (clientId: string | null) => clients.find((c) => c.id === clientId)?.name || '';

  const handleSubmit = async () => {
    if (!title.trim() || !user || !selectedGtClientId) return;
    setSubmitting(true);
    try {
      const insertData: any = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        gt_client_id: selectedGtClientId,
      };
      if (performedAt) {
        insertData.performed_at = performedAt.toISOString();
      }

      const { data, error } = await supabase
        .from('demand_submissions')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;

      if (selectedHelpers.length > 0) {
        const helperRows = selectedHelpers.map((h) => ({ submission_id: data.id, helper_user_id: h }));
        const { error: hError } = await supabase.from('demand_submission_helpers').insert(helperRows);
        if (hError) throw hError;
      }

      setSubmissions((prev) => [
        {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          created_at: data.created_at,
          performed_at: (data as any).performed_at || null,
          gt_client_id: (data as any).gt_client_id || null,
          helpers: selectedHelpers,
        },
        ...prev,
      ]);
      setTitle('');
      setDescription('');
      setPerformedAt(undefined);
      setSelectedGtClientId('');
      setSelectedHelpers([]);
      toast({ title: 'Demanda registrada', description: 'Sua demanda foi enviada para avaliação.' });
    } catch (error: any) {
      toast({ title: 'Erro ao registrar demanda', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHelper = (userId: string) => {
    setSelectedHelpers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleDelete = async (submissionId: string) => {
    try {
      await supabase.from('demand_submission_helpers').delete().eq('submission_id', submissionId);
      const { error } = await supabase.from('demand_submissions').delete().eq('id', submissionId);
      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      toast({ title: 'Demanda excluída' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Registrar Demanda Realizada
          </CardTitle>
          <CardDescription>
            Informe a atividade que você realizou, a data, o GT e quem ajudou no processo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="O que você fez..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Descreva em detalhes a demanda (opcional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date picker */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Data da realização</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !performedAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {performedAt ? format(performedAt, "dd/MM/yyyy", { locale: ptBR }) : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={performedAt}
                    onSelect={setPerformedAt}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* GT selector */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Grupo de Trabalho (GT)</p>
              {userGtClients.length > 0 ? (
                <Select value={selectedGtClientId} onValueChange={setSelectedGtClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o GT" />
                  </SelectTrigger>
                  <SelectContent>
                    {userGtClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Você não está alocado em nenhum GT.</p>
              )}
            </div>
          </div>

          {/* Helpers - only shown after GT selected */}
          {selectedGtClientId && gtProfiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Quem ajudou nesta demanda?
              </p>
              <div className="grid gap-2">
                {gtProfiles.map((p) => (
                  <label
                    key={p.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedHelpers.includes(p.user_id)}
                      onCheckedChange={() => toggleHelper(p.user_id)}
                    />
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(p.display_name, p.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{p.display_name || p.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedGtClientId && gtProfiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum outro membro encontrado neste GT.
            </p>
          )}

          <Button onClick={handleSubmit} disabled={!title.trim() || !selectedGtClientId || submitting}>
            <ClipboardList className="w-4 h-4 mr-2" />
            {submitting ? 'Enviando...' : 'Registrar Demanda'}
          </Button>
        </CardContent>
      </Card>

      {/* Submissions list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Minhas Demandas Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {submissions.map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{sub.title}</h3>
                    <Badge
                      className={
                        sub.status === 'evaluated'
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }
                    >
                      {sub.status === 'evaluated' ? (
                        <><Check className="w-3 h-3 mr-1" /> Avaliada</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> Pendente</>
                      )}
                    </Badge>
                  </div>
                  {sub.description && (
                    <p className="text-sm text-muted-foreground mb-2">{sub.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                    {sub.gt_client_id && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> GT: {getClientName(sub.gt_client_id)}
                      </span>
                    )}
                    {sub.performed_at && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> {new Date(sub.performed_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  {sub.helpers.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Ajudantes:</span>
                      <div className="flex -space-x-1">
                        {sub.helpers.map((hId) => {
                          const hp = getProfile(hId);
                          return (
                            <Avatar key={hId} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={hp?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {hp ? getInitials(hp.display_name, hp.email) : '?'}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Registrado em {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </motion.div>
              ))}
              {submissions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma demanda registrada ainda.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
