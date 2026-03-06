import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityScore {
  id: string;
  activity_id: string;
  user_id: string;
  execution_score: number;
  quality_score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberWithScore {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  total_execution: number;
  total_quality: number;
  activities_count: number;
  average_score: number;
}

export const useDemandsControl = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [scores, setScores] = useState<ActivityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [activitiesRes, scoresRes] = await Promise.all([
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_scores').select('*'),
      ]);

      if (activitiesRes.error) throw activitiesRes.error;
      if (scoresRes.error) throw scoresRes.error;

      setActivities(activitiesRes.data || []);
      setScores(scoresRes.data || []);
    } catch (error: any) {
      console.error('Error fetching demands data:', error);
      toast({ title: 'Erro ao carregar demandas', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addActivity = async (name: string, description: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({ name, description: description || null, created_by: userId })
        .select()
        .single();

      if (error) throw error;
      setActivities((prev) => [data, ...prev]);
      toast({ title: 'Atividade adicionada', description: `"${name}" foi criada com sucesso.` });
      return data;
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar atividade', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateActivity = async (id: string, updates: { name?: string; description?: string; status?: string }) => {
    try {
      const { error } = await supabase.from('activities').update(updates).eq('id', id);
      if (error) throw error;
      setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
      toast({ title: 'Atividade atualizada' });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar atividade', description: error.message, variant: 'destructive' });
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
      setActivities((prev) => prev.filter((a) => a.id !== id));
      setScores((prev) => prev.filter((s) => s.activity_id !== id));
      toast({ title: 'Atividade removida' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover atividade', description: error.message, variant: 'destructive' });
    }
  };

  const setScore = async (activityId: string, userId: string, executionScore: number, qualityScore: number, notes?: string) => {
    try {
      const existing = scores.find((s) => s.activity_id === activityId && s.user_id === userId);
      if (existing) {
        const { error } = await supabase
          .from('activity_scores')
          .update({ execution_score: executionScore, quality_score: qualityScore, notes: notes || null })
          .eq('id', existing.id);
        if (error) throw error;
        setScores((prev) =>
          prev.map((s) =>
            s.id === existing.id ? { ...s, execution_score: executionScore, quality_score: qualityScore, notes: notes || null } : s
          )
        );
      } else {
        const { data, error } = await supabase
          .from('activity_scores')
          .insert({ activity_id: activityId, user_id: userId, execution_score: executionScore, quality_score: qualityScore, notes: notes || null })
          .select()
          .single();
        if (error) throw error;
        setScores((prev) => [...prev, data]);
      }
      toast({ title: 'Pontuação salva' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar pontuação', description: error.message, variant: 'destructive' });
    }
  };

  const getMemberScores = (profiles: { user_id: string; display_name: string | null; email: string; avatar_url: string | null }[]): MemberWithScore[] => {
    return profiles.map((p) => {
      const memberScores = scores.filter((s) => s.user_id === p.user_id);
      const totalExecution = memberScores.reduce((sum, s) => sum + s.execution_score, 0);
      const totalQuality = memberScores.reduce((sum, s) => sum + s.quality_score, 0);
      const count = memberScores.length;
      const average = count > 0 ? (totalExecution + totalQuality) / (count * 2) : 0;

      return {
        user_id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        avatar_url: p.avatar_url,
        total_execution: totalExecution,
        total_quality: totalQuality,
        activities_count: count,
        average_score: Math.round(average * 10) / 10,
      };
    }).sort((a, b) => b.average_score - a.average_score);
  };

  const getScoreForActivity = (activityId: string, userId: string) => {
    return scores.find((s) => s.activity_id === activityId && s.user_id === userId);
  };

  return {
    activities,
    scores,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    setScore,
    getMemberScores,
    getScoreForActivity,
    refetch: fetchData,
  };
};
