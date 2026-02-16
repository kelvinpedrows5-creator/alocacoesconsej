import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface GTHandoffSurveyProps {
  clientId: string;
  clientName: string;
  cycleId: string;
  cycleLabel: string;
  open: boolean;
  onClose: () => void;
}

const HANDOFF_QUESTIONS = [
  { key: 'work_style', label: 'Como foi o estilo de trabalho com este cliente?', type: 'select', options: ['Muito colaborativo', 'Colaborativo', 'Moderado', 'Independente', 'Muito independente'] },
  { key: 'difficulty_level', label: 'Qual o nível de dificuldade das demandas?', type: 'select', options: ['Muito fácil', 'Fácil', 'Moderado', 'Difícil', 'Muito difícil'] },
  { key: 'communication_notes', label: 'Como foi a comunicação com o cliente? Dicas para o próximo GT:', type: 'textarea' },
  { key: 'key_learnings', label: 'Quais os principais aprendizados e pontos de atenção?', type: 'textarea' },
  { key: 'recommendations', label: 'Recomendações para quem assumir este GT:', type: 'textarea' },
];

export function GTHandoffSurvey({ clientId, clientName, cycleId, cycleLabel, open, onClose }: GTHandoffSurveyProps) {
  const { profile } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: existingSurvey } = useQuery({
    queryKey: ['handoff_survey', clientId, cycleId, profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data, error } = await supabase
        .from('gt_handoff_surveys')
        .select('*')
        .eq('client_id', clientId)
        .eq('cycle_id', cycleId)
        .eq('user_id', profile.user_id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setAnswers({
          work_style: data.work_style || '',
          difficulty_level: data.difficulty_level || '',
          communication_notes: data.communication_notes || '',
          key_learnings: data.key_learnings || '',
          recommendations: data.recommendations || '',
        });
      }
      return data;
    },
    enabled: open && !!profile?.user_id,
  });

  const handleSave = async () => {
    if (!profile?.user_id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('gt_handoff_surveys')
        .upsert({
          client_id: clientId,
          cycle_id: cycleId,
          user_id: profile.user_id,
          ...answers,
        }, { onConflict: 'client_id,cycle_id,user_id' });

      if (error) throw error;
      toast({ title: 'Pesquisa salva', description: 'Suas respostas foram registradas com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['handoff_surveys'] });
      queryClient.invalidateQueries({ queryKey: ['handoff_survey', clientId, cycleId, profile.user_id] });
      onClose();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Pesquisa de Passagem de Bastão
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {clientName} — {cycleLabel}
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {HANDOFF_QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label className="text-sm font-medium">{q.label}</Label>
              {q.type === 'select' ? (
                <Select value={answers[q.key] || ''} onValueChange={(v) => setAnswers(prev => ({ ...prev, [q.key]: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  value={answers[q.key] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                  placeholder="Descreva aqui..."
                  rows={3}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : existingSurvey ? 'Atualizar' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to display existing surveys for a GT
export function GTHandoffSurveyResults({ clientId, cycleId }: { clientId: string; cycleId: string }) {
  const { data: surveys = [] } = useQuery({
    queryKey: ['handoff_surveys', clientId, cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gt_handoff_surveys')
        .select('*')
        .eq('client_id', clientId)
        .eq('cycle_id', cycleId);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['handoff_survey_profiles', clientId, cycleId],
    queryFn: async () => {
      if (surveys.length === 0) return [];
      const userIds = surveys.map(s => s.user_id);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      if (error) throw error;
      return data;
    },
    enabled: surveys.length > 0,
  });

  if (surveys.length === 0) return null;

  const getProfileName = (userId: string) => {
    const p = profiles.find(p => p.user_id === userId);
    return p?.display_name || p?.email || 'Membro';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ClipboardList className="w-4 h-4 text-muted-foreground" />
        Pesquisas de Passagem de Bastão ({surveys.length})
      </div>
      <div className="space-y-2 pl-6">
        {surveys.map((survey) => (
          <Card key={survey.id} className="bg-muted/30">
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{getProfileName(survey.user_id)}</span>
                <div className="flex gap-1">
                  {survey.work_style && <Badge variant="outline" className="text-xs">{survey.work_style}</Badge>}
                  {survey.difficulty_level && <Badge variant="secondary" className="text-xs">{survey.difficulty_level}</Badge>}
                </div>
              </div>
              {survey.communication_notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Comunicação:</p>
                  <p className="text-sm">{survey.communication_notes}</p>
                </div>
              )}
              {survey.key_learnings && (
                <div>
                  <p className="text-xs text-muted-foreground">Aprendizados:</p>
                  <p className="text-sm">{survey.key_learnings}</p>
                </div>
              )}
              {survey.recommendations && (
                <div>
                  <p className="text-xs text-muted-foreground">Recomendações:</p>
                  <p className="text-sm">{survey.recommendations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
