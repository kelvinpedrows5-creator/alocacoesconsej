import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
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
  {
    key: 'q1_demands_executed',
    number: 1,
    label: 'Quais demandas foram executadas nesse GT?',
  },
  {
    key: 'q2_pending_demands',
    number: 2,
    label: 'Das demandas citadas acima, existe alguma ainda em andamento, ou todas foram finalizadas? Se sim, qual? Detalhe em que passo está.',
  },
  {
    key: 'q3_client_interest',
    number: 3,
    label: 'O cliente já demonstrou interesse em realizar outro(s) tipo(s) de demanda(s)? Se sim, essa(s) demanda(s) está(ão) no escopo contratual?',
  },
  {
    key: 'q4_client_profile',
    number: 4,
    label: 'Qual o perfil do cliente, suas preferências e padrões de comportamento? Ele utiliza de visual law?',
  },
  {
    key: 'q5_difficulties',
    number: 5,
    label: 'Quais foram as dificuldades encontradas no ciclo anterior?',
  },
  {
    key: 'q6_communication',
    number: 6,
    label: 'Como se deu a comunicação entre o GT e o cliente?',
  },
  {
    key: 'q7_client_value',
    number: 7,
    label: 'Como o cliente vê o valor da entrega e de que forma podemos entregar esse valor?',
  },
  {
    key: 'q8_general_summary',
    number: 8,
    label: 'Faça um resumo geral e resolutivo para os novos consultores, através de dicas assertivas e questões relevantes para o dia-a-dia do GT.',
  },
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
          q1_demands_executed: data.q1_demands_executed || '',
          q2_pending_demands: data.q2_pending_demands || '',
          q3_client_interest: data.q3_client_interest || '',
          q4_client_profile: data.q4_client_profile || '',
          q5_difficulties: data.q5_difficulties || '',
          q6_communication: data.q6_communication || '',
          q7_client_value: data.q7_client_value || '',
          q8_general_summary: data.q8_general_summary || '',
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
      queryClient.invalidateQueries({ queryKey: ['pending_handoff_surveys'] });
      onClose();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const answeredCount = HANDOFF_QUESTIONS.filter(q => answers[q.key]?.trim()).length;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Pesquisa de Passagem de Bastão
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {clientName} — {cycleLabel}
            </p>
            <Badge variant="outline" className="text-xs">
              {answeredCount}/{HANDOFF_QUESTIONS.length} respondidas
            </Badge>
          </div>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {HANDOFF_QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label className="text-sm font-medium flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                  {q.number}
                </span>
                <span>{q.label}</span>
              </Label>
              <div className="pl-8">
                <Textarea
                  value={answers[q.key] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                  placeholder="Descreva aqui..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : existingSurvey ? 'Atualizar Respostas' : 'Enviar Pesquisa'}
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

  const questionLabels: Record<string, string> = {
    q1_demands_executed: 'Demandas executadas',
    q2_pending_demands: 'Demandas em andamento',
    q3_client_interest: 'Interesse em novas demandas',
    q4_client_profile: 'Perfil do cliente',
    q5_difficulties: 'Dificuldades encontradas',
    q6_communication: 'Comunicação com o cliente',
    q7_client_value: 'Percepção de valor',
    q8_general_summary: 'Resumo geral para novos consultores',
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
            <CardContent className="py-3 px-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{getProfileName(survey.user_id)}</span>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              {Object.entries(questionLabels).map(([key, label]) => {
                const value = (survey as any)[key];
                if (!value) return null;
                return (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground font-medium">{label}:</p>
                    <p className="text-sm mt-0.5">{value}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
