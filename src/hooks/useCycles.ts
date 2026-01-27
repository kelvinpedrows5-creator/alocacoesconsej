import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AllocationCycle {
  id: string;
  label: string;
  value: string;
  is_visible: boolean;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export const useCycles = () => {
  const [cycles, setCycles] = useState<AllocationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCycles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('allocation_cycles')
        .select('*')
        .order('value', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error: any) {
      console.error('Error fetching cycles:', error);
      toast({
        title: 'Erro ao carregar ciclos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const addCycle = async (label: string, value: string) => {
    try {
      const { data, error } = await supabase
        .from('allocation_cycles')
        .insert({ label, value, is_visible: false, is_current: false })
        .select()
        .single();

      if (error) throw error;
      setCycles((prev) => [data, ...prev]);
      toast({
        title: 'Ciclo criado',
        description: `${label} foi adicionado com sucesso.`,
      });
      return data;
    } catch (error: any) {
      console.error('Error adding cycle:', error);
      toast({
        title: 'Erro ao criar ciclo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCycleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('allocation_cycles')
        .update({ is_visible: isVisible })
        .eq('id', id);

      if (error) throw error;
      setCycles((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_visible: isVisible } : c))
      );
      toast({
        title: isVisible ? 'Ciclo visível' : 'Ciclo oculto',
        description: `O ciclo agora está ${isVisible ? 'visível' : 'oculto'} para todos os membros.`,
      });
    } catch (error: any) {
      console.error('Error updating cycle visibility:', error);
      toast({
        title: 'Erro ao atualizar visibilidade',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const setCurrentCycle = async (id: string) => {
    try {
      // First, unset all current cycles
      await supabase
        .from('allocation_cycles')
        .update({ is_current: false })
        .neq('id', id);

      // Then set the new current cycle
      const { error } = await supabase
        .from('allocation_cycles')
        .update({ is_current: true })
        .eq('id', id);

      if (error) throw error;
      setCycles((prev) =>
        prev.map((c) => ({ ...c, is_current: c.id === id }))
      );
      toast({
        title: 'Ciclo atual atualizado',
        description: 'O ciclo selecionado agora é o ciclo atual.',
      });
    } catch (error: any) {
      console.error('Error setting current cycle:', error);
      toast({
        title: 'Erro ao definir ciclo atual',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteCycle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('allocation_cycles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCycles((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: 'Ciclo removido',
        description: 'O ciclo foi removido com sucesso.',
      });
    } catch (error: any) {
      console.error('Error deleting cycle:', error);
      toast({
        title: 'Erro ao remover ciclo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    cycles,
    loading,
    fetchCycles,
    addCycle,
    updateCycleVisibility,
    setCurrentCycle,
    deleteCycle,
  };
};
