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
  Edit2,
  Check,
  X,
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
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [scoringDialog, setScoringDialog] = useState<{ activityId: string; userId: string; userName: string } | null>(null);
  const [executionScore, setExecutionScore] = useState(5);
  const [qualityScore, setQualityScore] = useState(5);
  const [scoreNotes, setScoreNotes] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url');
      setProfiles(data || []);
    };
    fetchProfiles();
  }, []);

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

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

  const memberScores = getMemberScores(profiles);
  const filteredMembers = memberScores.filter(
    (m) =>
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.display_name && m.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="activities" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <Star className="w-4 h-4" />
            Ranking de Membros
          </TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nova Atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Nome da atividade..."
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
              />
              <Textarea
                placeholder="Descrição (opcional)..."
                value={newActivityDesc}
                onChange={(e) => setNewActivityDesc(e.target.value)}
                rows={2}
              />
              <Button onClick={handleAddActivity} disabled={!newActivityName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Atividade
              </Button>
            </CardContent>
          </Card>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{activity.name}</h3>
                          <Badge className={statusColors[activity.status] || ''}>
                            {statusLabels[activity.status] || activity.status}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={activity.status}
                          onValueChange={(val) => updateActivity(activity.id, { status: val })}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em Andamento</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
                          }
                        >
                          {expandedActivity === activity.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: show members to score */}
                    {expandedActivity === activity.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 border-t border-border pt-4"
                      >
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Pontuar membros nesta atividade:
                        </p>
                        <div className="grid gap-2">
                          {profiles.map((profile) => {
                            const score = getScoreForActivity(activity.id, profile.user_id);
                            return (
                              <div
                                key={profile.user_id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={profile.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(profile.display_name, profile.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {profile.display_name || profile.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {score && (
                                    <Badge variant="outline" className="text-xs">
                                      E:{score.execution_score} Q:{score.quality_score}
                                    </Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleOpenScoring(
                                        activity.id,
                                        profile.user_id,
                                        profile.display_name || profile.email
                                      )
                                    }
                                  >
                                    <Star className="w-3 h-3 mr-1" />
                                    Pontuar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma atividade cadastrada ainda.</p>
                </div>
              )}
            </div>
          </ScrollArea>
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
                  <Input
                    placeholder="Buscar membro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
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
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.display_name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.display_name || member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.activities_count} atividade{member.activities_count !== 1 ? 's' : ''} avaliada{member.activities_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Execução</p>
                          <p className="font-bold text-foreground">{member.total_execution}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Qualidade</p>
                          <p className="font-bold text-foreground">{member.total_quality}</p>
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
            <DialogDescription>
              Defina a nota de execução e qualidade para esta atividade (0-10).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Execução: {executionScore}
              </label>
              <Slider
                value={[executionScore]}
                onValueChange={([val]) => setExecutionScore(val)}
                max={10}
                min={0}
                step={1}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Qualidade: {qualityScore}
              </label>
              <Slider
                value={[qualityScore]}
                onValueChange={([val]) => setQualityScore(val)}
                max={10}
                min={0}
                step={1}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Observações (opcional)
              </label>
              <Textarea
                value={scoreNotes}
                onChange={(e) => setScoreNotes(e.target.value)}
                placeholder="Comentários sobre o desempenho..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScoringDialog(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveScore}>
                <Check className="w-4 h-4 mr-2" />
                Salvar Pontuação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
