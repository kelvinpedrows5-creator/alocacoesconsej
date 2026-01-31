import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  client_id: string;
  question_1: string | null;
  question_2: string | null;
  question_3: string | null;
  question_4: string | null;
  question_5: string | null;
  question_6: string | null;
  question_7: string | null;
  question_8: string | null;
  question_9: string | null;
  question_10: string | null;
  created_at: string;
  updated_at: string;
}

export interface GTMember {
  id: string;
  client_id: string;
  user_id: string;
  role: 'director' | 'manager' | 'consultant';
  cycle_id: string;
  created_at: string;
  updated_at: string;
}

export const GT_PROFILE_QUESTIONS = [
  { key: 'question_1', label: 'Qual é o segmento de atuação do cliente?' },
  { key: 'question_2', label: 'Qual o porte da empresa cliente?' },
  { key: 'question_3', label: 'Qual a complexidade dos projetos demandados?' },
  { key: 'question_4', label: 'Qual a frequência de reuniões esperada?' },
  { key: 'question_5', label: 'Qual o nível de conhecimento técnico do cliente?' },
  { key: 'question_6', label: 'Como é o processo de tomada de decisão do cliente?' },
  { key: 'question_7', label: 'Qual o tempo médio de projeto esperado?' },
  { key: 'question_8', label: 'Qual o perfil de comunicação preferido pelo cliente?' },
  { key: 'question_9', label: 'Qual o grau de autonomia dado à equipe?' },
  { key: 'question_10', label: 'Qual o histórico de satisfação com a CONSEJ?' },
] as const;

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: clientProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['client_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*');
      
      if (error) throw error;
      return data as ClientProfile[];
    },
  });

  const { data: gtMembers = [], isLoading: gtMembersLoading } = useQuery({
    queryKey: ['gt_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gt_members')
        .select('*');
      
      if (error) throw error;
      return data as GTMember[];
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (client: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar cliente: ' + error.message);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['gt_members'] });
      toast.success('Cliente removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover cliente: ' + error.message);
    },
  });

  const upsertClientProfileMutation = useMutation({
    mutationFn: async (profile: Partial<ClientProfile> & { client_id: string }) => {
      const { data, error } = await supabase
        .from('client_profiles')
        .upsert(profile, { onConflict: 'client_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_profiles'] });
      toast.success('Perfil do cliente salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar perfil do cliente: ' + error.message);
    },
  });

  const addGTMemberMutation = useMutation({
    mutationFn: async (member: { client_id: string; user_id: string; role: string; cycle_id: string }) => {
      // Validate constraints: max 1 director, max 1 manager, max 3 consultants per GT per cycle
      const existingMembers = gtMembers.filter(
        m => m.client_id === member.client_id && m.cycle_id === member.cycle_id
      );
      
      if (member.role === 'director') {
        const existingDirectors = existingMembers.filter(m => m.role === 'director');
        if (existingDirectors.length >= 1) {
          throw new Error('Já existe um diretor neste GT para este ciclo');
        }
      }
      
      if (member.role === 'manager') {
        const existingManagers = existingMembers.filter(m => m.role === 'manager');
        if (existingManagers.length >= 1) {
          throw new Error('Já existe um gerente neste GT para este ciclo');
        }
      }
      
      if (member.role === 'consultant') {
        const existingConsultants = existingMembers.filter(m => m.role === 'consultant');
        if (existingConsultants.length >= 3) {
          throw new Error('Este GT já possui 3 consultores para este ciclo');
        }
      }

      const { data, error } = await supabase
        .from('gt_members')
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gt_members'] });
      toast.success('Membro adicionado ao GT com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar membro: ' + error.message);
    },
  });

  const removeGTMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gt_members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gt_members'] });
      toast.success('Membro removido do GT com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover membro: ' + error.message);
    },
  });

  const getClientProfile = (clientId: string) => {
    return clientProfiles.find(p => p.client_id === clientId);
  };

  const getGTMembersByClient = (clientId: string, cycleId?: string) => {
    return gtMembers.filter(m => 
      m.client_id === clientId && 
      (cycleId ? m.cycle_id === cycleId : true)
    );
  };

  return {
    clients,
    clientProfiles,
    gtMembers,
    isLoading: clientsLoading || profilesLoading || gtMembersLoading,
    addClient: addClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    upsertClientProfile: upsertClientProfileMutation.mutate,
    addGTMember: addGTMemberMutation.mutate,
    removeGTMember: removeGTMemberMutation.mutate,
    getClientProfile,
    getGTMembersByClient,
  };
}
