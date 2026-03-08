import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  ClipboardList,
  Users,
  Star,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useDemandsControl } from '@/hooks/useDemandsControl';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface SubmissionData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  helpers: string[];
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  in_progress: 'bg-primary/20 text-primary',
  completed: 'bg-success/20 text-success',
};

export function DemandsControl() {
  const { user } = useAuthContext();
  const {
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    setScore,
    getMemberScores,
    getScoreForActivity,
  } = useDemandsControl();

  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [leadershipPositions, setLeadershipPositions] = useState<{ user_id: string; directorate_id: string; position_type: string }[]>([]);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [scoringDialog, setScoringDialog] = useState<{ activityId: string; userId: string; userName: string } | null>(null);
  const [executionScore, setExecutionScore] = useState(5);
  const [qualityScore, setQualityScore] = useState(5);
  const [scoreNotes, setScoreNotes] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<SubmissionData | null>(null);
  const [evalExecution, setEvalExecution] = useState(5);
  const [evalQuality, setEvalQuality] = useState(5);
  const [evalNotes, setEvalNotes] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      const [profilesRes, leadershipRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, email, avatar_url'),
        supabase.from('leadership_positions').select('user_id, directorate_id, position_type'),
      ]);
      setProfiles(profilesRes.data || []);
      setLeadershipPositions(leadershipRes.data || []);
    };
    fetchProfiles();
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const [subsRes, helpersRes] = await Promise.all([
      supabase.from('demand_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('demand_submission_helpers').select('*'),
    ]);
    const allHelpers = helpersRes.data || [];
    const subs: SubmissionData[] = (subsRes.data || []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      title: s.title,
      description: s.description,
      status: s.status,
      created_at: s.created_at,
      helpers: allHelpers.filter((h: any) => h.submission_id === s.id).map((h: any) => h.helper_user_id),
    }));
    setSubmissions(subs);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  const handleAddActivity = async () => {
    if (!newActivityName.trim() || !user) return;
    await addActivity(newActivityName.trim(), newActivityDesc.trim(), user.id);
    setNewActivityName('');
    setNewActivityDesc('');
  };

  const handleOpenScoring = (activityId: string, userId: string, userName: string) => {
    const existing = getScoreForActivity(activityId, userId);
    setExecutionScore(existing?.execution_score ?? 5);
    setQualityScore(existing?.quality_score ?? 5);
    setScoreNotes(existing?.notes || '');
    setScoringDialog({ activityId, userId, userName });
  };

  const handleSaveScore = async () => {
    if (!scoringDialog) return;
    await setScore(scoringDialog.activityId, scoringDialog.userId, executionScore, qualityScore, scoreNotes);
    setScoringDialog(null);
  };

  const handleOpenEvaluation = (sub: SubmissionData) => {
    setEvaluatingSubmission(sub);
    setEvalExecution(5);
    setEvalQuality(5);
    setEvalNotes('');
  };

  const handleEvaluateSubmission = async () => {
    if (!evaluatingSubmission || !user) return;
    const activity = await addActivity(evaluatingSubmission.title, evaluatingSubmission.description || '', user.id);
    if (activity) {
      await setScore(activity.id, evaluatingSubmission.user_id, evalExecution, evalQuality, evalNotes);
      for (const helperId of evaluatingSubmission.helpers) {
        await setScore(activity.id, helperId, evalExecution, evalQuality, evalNotes);
      }
      await supabase.from('demand_submissions').update({ status: 'evaluated' }).eq('id', evaluatingSubmission.id);
      setSubmissions((prev) => prev.map((s) => s.id === evaluatingSubmission.id ? { ...s, status: 'evaluated' } : s));
    }
    setEvaluatingSubmission(null);
  };

  // Exclude directors and demandas managers from ranking
  const rankingProfiles = profiles.filter((p) => {
    const isDirector = leadershipPositions.some(
      (lp) => lp.user_id === p.user_id && lp.position_type === 'director'
    );
    const isDemandasManager = leadershipPositions.some(
      (lp) => lp.user_id === p.user_id && lp.directorate_id === 'dir-1' && lp.position_type === 'manager'
    );
    return !isDirector && !isDemandasManager;
  });

  const memberScores = getMemberScores(rankingProfiles, submissions);
  const filteredMembers = memberScores.filter(
    (m) =>
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.display_name && m.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="submissions" className="gap-2">
            <Inbox className="w-4 h-4" />
            Demandas Recebidas
            {pendingSubmissions.length > 0 && (
              <Badge className="bg-destructive/20 text-destructive ml-1 text-xs">{pendingSubmissions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <Star className="w-4 h-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-primary" />
                Demandas Enviadas pelos Membros
              </CardTitle>
              <CardDescription>
                Avalie as demandas registradas pelos membros. A avaliação gera pontuação no ranking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const submitter = getProfile(sub.user_id);
                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={submitter?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {submitter ? getInitials(submitter.display_name, submitter.email) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{submitter?.display_name || submitter?.email || 'Membro'}</span>
                              <Badge className={sub.status === 'evaluated' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                                {sub.status === 'evaluated' ? 'Avaliada' : 'Pendente'}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-foreground">{sub.title}</h3>
                            {sub.description && <p className="text-sm text-muted-foreground">{sub.description}</p>}
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
                          </div>
                          {sub.status === 'pending' && (
                            <Button size="sm" onClick={() => handleOpenEvaluation(sub)}>
                              <Star className="w-3 h-3 mr-1" />
                              Avaliar
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {submissions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma demanda recebida ainda.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Ranking de Membros por Pontuação
              </CardTitle>
              <CardDescription>
                A pontuação média influencia diretamente na sugestão de membros para Grupos de Trabalho.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar membro..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredMembers.map((member, index) => (
                    <motion.div
                      key={member.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(member.display_name, member.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.display_name || member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.demands_count} demanda{member.demands_count !== 1 ? 's' : ''} realizada{member.demands_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Execução</p>
                          <p className="font-bold text-foreground">{member.avg_execution.toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Qualidade</p>
                          <p className="font-bold text-foreground">{member.avg_quality.toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Média</p>
                          <Badge
                            className={
                              member.average_score >= 7
                                ? 'bg-success/20 text-success'
                                : member.average_score >= 4
                                ? 'bg-warning/20 text-warning'
                                : 'bg-destructive/20 text-destructive'
                            }
                          >
                            {member.average_score.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scoring Dialog */}
      <Dialog open={!!scoringDialog} onOpenChange={() => setScoringDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pontuar: {scoringDialog?.userName}</DialogTitle>
            <DialogDescription>Defina a nota de execução e qualidade (0-10).</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Execução: {executionScore}</label>
              <Slider value={[executionScore]} onValueChange={([val]) => setExecutionScore(val)} max={10} min={0} step={1} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Qualidade: {qualityScore}</label>
              <Slider value={[qualityScore]} onValueChange={([val]) => setQualityScore(val)} max={10} min={0} step={1} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Observações (opcional)</label>
              <Textarea value={scoreNotes} onChange={(e) => setScoreNotes(e.target.value)} placeholder="Comentários..." rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScoringDialog(null)}>Cancelar</Button>
              <Button onClick={handleSaveScore}>
                <Check className="w-4 h-4 mr-2" />
                Salvar Pontuação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={!!evaluatingSubmission} onOpenChange={() => setEvaluatingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Demanda</DialogTitle>
            <DialogDescription>
              {evaluatingSubmission?.title} — enviada por {getProfile(evaluatingSubmission?.user_id || '')?.display_name || 'membro'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {evaluatingSubmission?.description && (
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">{evaluatingSubmission.description}</p>
            )}
            {evaluatingSubmission && evaluatingSubmission.helpers.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ajudantes:</span>
                {evaluatingSubmission.helpers.map((hId) => {
                  const hp = getProfile(hId);
                  return (
                    <Badge key={hId} variant="outline" className="text-xs">
                      {hp?.display_name || hp?.email || hId}
                    </Badge>
                  );
                })}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Execução: {evalExecution}</label>
              <Slider value={[evalExecution]} onValueChange={([val]) => setEvalExecution(val)} max={10} min={0} step={1} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Qualidade: {evalQuality}</label>
              <Slider value={[evalQuality]} onValueChange={([val]) => setEvalQuality(val)} max={10} min={0} step={1} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Observações (opcional)</label>
              <Textarea value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} placeholder="Comentários..." rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEvaluatingSubmission(null)}>Cancelar</Button>
              <Button onClick={handleEvaluateSubmission}>
                <Check className="w-4 h-4 mr-2" />
                Avaliar e Pontuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
