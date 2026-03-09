import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  description: string | null;
  contract_scope_url: string | null;
  contract_scope_type: string | null;
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
  { 
    key: 'question_1', 
    label: 'Como o cliente enxerga valor nas entregas realizadas?',
    options: ['Resultados tangíveis e mensuráveis', 'Qualidade do processo e metodologia', 'Inovação e criatividade', 'Custo-benefício', 'Relacionamento e confiança']
  },
  { 
    key: 'question_2', 
    label: 'Qual a frequência e intensidade de contato do cliente?',
    options: ['Alta - contato diário', 'Média - contato semanal', 'Baixa - contato quinzenal/mensal', 'Pontual - apenas em marcos importantes']
  },
  { 
    key: 'question_3', 
    label: 'Como o cliente costuma fazer pedidos de demandas?',
    options: ['Demandas estruturadas e documentadas', 'Demandas verbais em reuniões', 'Demandas informais por mensagem', 'Demandas emergenciais e urgentes']
  },
  { 
    key: 'question_4', 
    label: 'Qual a flexibilidade do cliente em relação a prazos?',
    options: ['Muito rígido - não negocia prazos', 'Moderadamente flexível', 'Flexível - adapta conforme justificativa', 'Sem urgência - prioriza qualidade']
  },
  { 
    key: 'question_5', 
    label: 'Qual o nível de complexidade típico das demandas?',
    options: ['Alta complexidade - exige especialistas', 'Média complexidade - exige experiência', 'Baixa complexidade - demandas operacionais', 'Variável - depende do projeto']
  },
  { 
    key: 'question_6', 
    label: 'Como é o processo de aprovação do cliente?',
    options: ['Centralizado - uma pessoa decide', 'Comitê - várias pessoas validam', 'Hierárquico - passa por níveis', 'Ágil - decisões rápidas e delegadas']
  },
  { 
    key: 'question_7', 
    label: 'Qual o nível de conhecimento técnico do cliente sobre os projetos?',
    options: ['Alto - entende detalhes técnicos', 'Médio - conhecimento geral', 'Baixo - precisa de muita explicação', 'Variável por interlocutor']
  },
  { 
    key: 'question_8', 
    label: 'Como o cliente prefere receber atualizações e relatórios?',
    options: ['Relatórios formais periódicos', 'Dashboards e métricas online', 'Reuniões de alinhamento', 'Comunicação assíncrona (e-mail/mensagem)']
  },
  { 
    key: 'question_9', 
    label: 'Qual o histórico de relacionamento com a CONSEJ?',
    options: ['Cliente novo - primeiro projeto', 'Relacionamento recente - menos de 1 ano', 'Relacionamento consolidado - 1 a 3 anos', 'Parceria de longa data - mais de 3 anos']
  },
  { 
    key: 'question_10', 
    label: 'Qual o perfil de feedback do cliente?',
    options: ['Proativo - dá feedback constante', 'Reativo - só comenta quando solicitado', 'Crítico - aponta problemas frequentemente', 'Elogioso - reconhece boas entregas']
  },
] as const;

export interface ClientCycle {
  id: string;
  client_id: string;
  cycle_id: string;
  created_at: string;
}

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

  const { data: clientCycles = [], isLoading: clientCyclesLoading } = useQuery({
    queryKey: ['client_cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_cycles')
        .select('*');
      
      if (error) throw error;
      return data as ClientCycle[];
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (client: { name: string; description?: string; cycleId?: string }) => {
      const { cycleId, ...clientData } = client;
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw error;

      // Link to cycle if provided
      if (cycleId && data) {
        await supabase.from('client_cycles').insert({
          client_id: data.id,
          cycle_id: cycleId,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_cycles'] });
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

  const linkClientToCycleMutation = useMutation({
    mutationFn: async ({ clientId, cycleId }: { clientId: string; cycleId: string }) => {
      const { error } = await supabase
        .from('client_cycles')
        .insert({ client_id: clientId, cycle_id: cycleId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_cycles'] });
      toast.success('Cliente vinculado ao ciclo!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao vincular cliente: ' + error.message);
    },
  });

  const unlinkClientFromCycleMutation = useMutation({
    mutationFn: async ({ clientId, cycleId }: { clientId: string; cycleId: string }) => {
      const { error } = await supabase
        .from('client_cycles')
        .delete()
        .eq('client_id', clientId)
        .eq('cycle_id', cycleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_cycles'] });
      toast.success('Cliente removido do ciclo!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover vínculo: ' + error.message);
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

  const getClientsByCycle = (cycleId: string) => {
    const linkedIds = clientCycles.filter(cc => cc.cycle_id === cycleId).map(cc => cc.client_id);
    return clients.filter(c => linkedIds.includes(c.id));
  };

  const isClientInCycle = (clientId: string, cycleId: string) => {
    return clientCycles.some(cc => cc.client_id === clientId && cc.cycle_id === cycleId);
  };

  return {
    clients,
    clientProfiles,
    gtMembers,
    clientCycles,
    isLoading: clientsLoading || profilesLoading || gtMembersLoading || clientCyclesLoading,
    addClient: addClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    upsertClientProfile: upsertClientProfileMutation.mutate,
    addGTMember: addGTMemberMutation.mutate,
    removeGTMember: removeGTMemberMutation.mutate,
    linkClientToCycle: linkClientToCycleMutation.mutate,
    unlinkClientFromCycle: unlinkClientFromCycleMutation.mutate,
    getClientProfile,
    getGTMembersByClient,
    getClientsByCycle,
    isClientInCycle,
  };
}
