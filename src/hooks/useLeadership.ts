import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LeadershipPosition {
  id: string;
  user_id: string;
  directorate_id: string;
  position_type: 'manager' | 'director';
  created_at: string;
  updated_at: string;
}

export interface LeadershipWithProfile extends LeadershipPosition {
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

export const useLeadership = () => {
  const [positions, setPositions] = useState<LeadershipWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch leadership positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('leadership_positions')
        .select('*');

      if (positionsError) throw positionsError;

      if (!positionsData || positionsData.length === 0) {
        setPositions([]);
        return;
      }

      // Fetch profiles for these users
      const userIds = positionsData.map((p) => p.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Merge data
      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      const positionsWithProfiles: LeadershipWithProfile[] = positionsData.map((pos) => {
        const profile = profilesMap.get(pos.user_id);
        return {
          ...pos,
          position_type: pos.position_type as 'manager' | 'director',
          display_name: profile?.display_name || null,
          email: profile?.email || '',
          avatar_url: profile?.avatar_url || null,
        };
      });

      setPositions(positionsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching leadership positions:', error);
      toast({
        title: 'Erro ao carregar lideranças',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const addPosition = async (
    userId: string,
    directorateId: string,
    positionType: 'manager' | 'director'
  ) => {
    try {
      // Check constraints: max 2 managers per directorate, max 1 director per directorate
      const existingPositions = positions.filter(
        (p) => p.directorate_id === directorateId && p.position_type === positionType
      );

      if (positionType === 'manager' && existingPositions.length >= 2) {
        toast({
          title: 'Limite atingido',
          description: 'Já existem 2 gerentes nesta diretoria.',
          variant: 'destructive',
        });
        return null;
      }

      if (positionType === 'director' && existingPositions.length >= 1) {
        toast({
          title: 'Limite atingido',
          description: 'Já existe 1 diretor nesta diretoria.',
          variant: 'destructive',
        });
        return null;
      }

      const { data, error } = await supabase
        .from('leadership_positions')
        .insert({ user_id: userId, directorate_id: directorateId, position_type: positionType })
        .select()
        .single();

      if (error) throw error;

      // Fetch profile for the new position
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .eq('user_id', userId)
        .single();

      const newPosition: LeadershipWithProfile = {
        ...data,
        position_type: data.position_type as 'manager' | 'director',
        display_name: profile?.display_name || null,
        email: profile?.email || '',
        avatar_url: profile?.avatar_url || null,
      };

      setPositions((prev) => [...prev, newPosition]);
      toast({
        title: 'Liderança adicionada',
        description: `${positionType === 'manager' ? 'Gerente' : 'Diretor'} adicionado com sucesso.`,
      });
      return data;
    } catch (error: any) {
      console.error('Error adding leadership position:', error);
      toast({
        title: 'Erro ao adicionar liderança',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const removePosition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leadership_positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPositions((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Liderança removida',
        description: 'O cargo de liderança foi removido.',
      });
    } catch (error: any) {
      console.error('Error removing leadership position:', error);
      toast({
        title: 'Erro ao remover liderança',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getDirectorateLeaders = (directorateId: string) => {
    const directors = positions.filter(
      (p) => p.directorate_id === directorateId && p.position_type === 'director'
    );
    const managers = positions.filter(
      (p) => p.directorate_id === directorateId && p.position_type === 'manager'
    );
    return { directors, managers };
  };

  return {
    positions,
    loading,
    fetchPositions,
    addPosition,
    removePosition,
    getDirectorateLeaders,
  };
};
