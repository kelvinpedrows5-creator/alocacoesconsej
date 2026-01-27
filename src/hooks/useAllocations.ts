import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MemberAllocation {
  id: string;
  user_id: string;
  cycle_id: string;
  coordination_id: string;
  created_at: string;
  updated_at: string;
}

export interface AllocationWithProfile extends MemberAllocation {
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export const useAllocations = (cycleId?: string) => {
  const [allocations, setAllocations] = useState<AllocationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('member_allocations').select('*');
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }

      const { data: allocationsData, error: allocationsError } = await query;

      if (allocationsError) throw allocationsError;

      if (!allocationsData || allocationsData.length === 0) {
        setAllocations([]);
        return;
      }

      // Fetch profiles for these users
      const userIds = allocationsData.map((a) => a.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Merge data
      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const allocationsWithProfiles: AllocationWithProfile[] = allocationsData.map((alloc) => {
        const profile = profilesMap.get(alloc.user_id);
        return {
          ...alloc,
          display_name: profile?.display_name || null,
          email: profile?.email || '',
          avatar_url: profile?.avatar_url || null,
        };
      });

      setAllocations(allocationsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching allocations:', error);
      toast({
        title: 'Erro ao carregar alocações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [cycleId, toast]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const setAllocation = async (userId: string, cycleId: string, coordinationId: string) => {
    try {
      // Check if allocation already exists
      const { data: existing } = await supabase
        .from('member_allocations')
        .select('id')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .single();

      if (existing) {
        // Update existing allocation
        const { error } = await supabase
          .from('member_allocations')
          .update({ coordination_id: coordinationId })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new allocation
        const { error } = await supabase
          .from('member_allocations')
          .insert({ user_id: userId, cycle_id: cycleId, coordination_id: coordinationId });

        if (error) throw error;
      }

      await fetchAllocations();
      toast({
        title: 'Alocação atualizada',
        description: 'A alocação do membro foi atualizada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error setting allocation:', error);
      toast({
        title: 'Erro ao atualizar alocação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const bulkSetAllocations = async (
    allocations: { userId: string; coordinationId: string }[],
    cycleId: string
  ) => {
    try {
      // Delete existing allocations for this cycle and these users
      const userIds = allocations.map((a) => a.userId);
      await supabase
        .from('member_allocations')
        .delete()
        .eq('cycle_id', cycleId)
        .in('user_id', userIds);

      // Insert new allocations
      const newAllocations = allocations.map((a) => ({
        user_id: a.userId,
        cycle_id: cycleId,
        coordination_id: a.coordinationId,
      }));

      const { error } = await supabase
        .from('member_allocations')
        .insert(newAllocations);

      if (error) throw error;

      await fetchAllocations();
      toast({
        title: 'Alocações atualizadas',
        description: `${allocations.length} alocações foram processadas.`,
      });
    } catch (error: any) {
      console.error('Error bulk setting allocations:', error);
      toast({
        title: 'Erro ao atualizar alocações',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const removeAllocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('member_allocations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAllocations((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: 'Alocação removida',
        description: 'A alocação foi removida.',
      });
    } catch (error: any) {
      console.error('Error removing allocation:', error);
      toast({
        title: 'Erro ao remover alocação',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    allocations,
    loading,
    fetchAllocations,
    setAllocation,
    bulkSetAllocations,
    removeAllocation,
  };
};
