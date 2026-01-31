import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { directorates, coordinations } from '@/data/mockData';

export function useRealStats(userId?: string) {
  // Fetch all profiles (real members in the system)
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['all_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all allocations
  const { data: allocations = [], isLoading: allocationsLoading } = useQuery({
    queryKey: ['all_allocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_allocations')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch visible cycles
  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ['visible_cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allocation_cycles')
        .select('*')
        .eq('is_visible', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch clients (GTs)
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate user progress (unique directorates visited)
  const getUserProgress = () => {
    if (!userId) return { visited: 0, total: directorates.length };

    const userAllocations = allocations.filter(a => a.user_id === userId);
    const visitedCoordIds = new Set(userAllocations.map(a => a.coordination_id));
    const visitedDirectorateIds = new Set<string>();

    visitedCoordIds.forEach(coordId => {
      const coord = coordinations.find(c => c.id === coordId);
      if (coord) {
        visitedDirectorateIds.add(coord.directorateId);
      }
    });

    return { visited: visitedDirectorateIds.size, total: directorates.length };
  };

  return {
    totalMembers: profiles.length,
    totalCoordinations: coordinations.length,
    totalDirectorates: directorates.length,
    totalClients: clients.length,
    userProgress: getUserProgress(),
    isLoading: profilesLoading || allocationsLoading || cyclesLoading || clientsLoading,
  };
}
