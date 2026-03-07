import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Users, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Submission {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  helpers: string[];
}

export function MemberDemandSubmission() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [gtMembers, setGtMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsRes, profilesRes, helpersRes, gtRes] = await Promise.all([
        supabase.from('demand_submissions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name, email, avatar_url'),
        supabase.from('demand_submission_helpers').select('*'),
        supabase.from('gt_members').select('user_id, client_id, cycle_id'),
      ]);

      const allProfiles = profilesRes.data || [];
      setProfiles(allProfiles);

      // Find which GT the current user belongs to (current cycle)
      const userGtEntries = (gtRes.data || []).filter((g) => g.user_id === user!.id);
      const userClientIds = userGtEntries.map((g) => g.client_id);
      const userCycleIds = userGtEntries.map((g) => g.cycle_id);
      // Get all members from the same GTs
      const sameGtMembers = (gtRes.data || [])
        .filter((g) => userClientIds.includes(g.client_id) && userCycleIds.includes(g.cycle_id) && g.user_id !== user!.id)
        .map((g) => g.user_id);
      setGtMembers([...new Set(sameGtMembers)]);

      const allHelpers = helpersRes.data || [];
      const subs: Submission[] = (submissionsRes.data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        created_at: s.created_at,
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

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('demand_submissions')
        .insert({ user_id: user.id, title: title.trim(), description: description.trim() || null })
        .select()
        .single();
      if (error) throw error;

      // Insert helpers
      if (selectedHelpers.length > 0) {
        const helperRows = selectedHelpers.map((h) => ({ submission_id: data.id, helper_user_id: h }));
        const { error: hError } = await supabase.from('demand_submission_helpers').insert(helperRows);
        if (hError) throw hError;
      }

      setSubmissions((prev) => [
        { id: data.id, title: data.title, description: data.description, status: data.status, created_at: data.created_at, helpers: selectedHelpers },
        ...prev,
      ]);
      setTitle('');
      setDescription('');
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

  const gtProfiles = profiles.filter((p) => gtMembers.includes(p.user_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submit new demand */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Registrar Demanda Realizada
          </CardTitle>
          <CardDescription>
            Informe a atividade que você realizou e quem ajudou no processo.
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

          {gtProfiles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Quem ajudou nesta demanda? (membros do seu GT)
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

          {gtProfiles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Você não está alocado em nenhum GT no momento. Não é possível selecionar ajudantes.
            </p>
          )}

          <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
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
                    {new Date(sub.created_at).toLocaleDateString('pt-BR')}
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
