import { Member, Coordination, Directorate } from '@/types';

export const directorates: Directorate[] = [
  { id: 'dir-1', name: 'Diretoria de Operações', description: 'Gerencia operações e processos internos' },
  { id: 'dir-2', name: 'Diretoria de Marketing', description: 'Estratégias de marketing e comunicação' },
  { id: 'dir-3', name: 'Diretoria de Tecnologia', description: 'Desenvolvimento e inovação tecnológica' },
];

export const coordinations: Coordination[] = [
  { id: 'coord-1', name: 'Projetos', description: 'Gestão de projetos estratégicos', color: '#3B82F6', directorateId: 'dir-1', maxMembers: 5 },
  { id: 'coord-2', name: 'Processos', description: 'Otimização de processos internos', color: '#10B981', directorateId: 'dir-1', maxMembers: 4 },
  { id: 'coord-3', name: 'Comunicação', description: 'Comunicação interna e externa', color: '#F59E0B', directorateId: 'dir-2', maxMembers: 4 },
  { id: 'coord-4', name: 'Mídias Sociais', description: 'Gestão de redes sociais', color: '#EC4899', directorateId: 'dir-2', maxMembers: 3 },
  { id: 'coord-5', name: 'Desenvolvimento', description: 'Desenvolvimento de software', color: '#8B5CF6', directorateId: 'dir-3', maxMembers: 6 },
  { id: 'coord-6', name: 'Dados', description: 'Análise e ciência de dados', color: '#06B6D4', directorateId: 'dir-3', maxMembers: 4 },
];

export const members: Member[] = [
  {
    id: 'mem-1',
    name: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    currentCoordinationId: 'coord-1',
    joinedAt: '2023-01-15',
    history: [
      { coordinationId: 'coord-3', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-5', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-2', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-1', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-2',
    name: 'Bruno Costa',
    email: 'bruno.costa@empresa.com',
    currentCoordinationId: 'coord-2',
    joinedAt: '2023-02-01',
    history: [
      { coordinationId: 'coord-1', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-4', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-2', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-3',
    name: 'Carla Mendes',
    email: 'carla.mendes@empresa.com',
    currentCoordinationId: 'coord-3',
    joinedAt: '2023-01-20',
    history: [
      { coordinationId: 'coord-6', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-3', quarter: '2023-Q2', startDate: '2023-04-01' },
    ],
  },
  {
    id: 'mem-4',
    name: 'Daniel Oliveira',
    email: 'daniel.oliveira@empresa.com',
    currentCoordinationId: 'coord-5',
    joinedAt: '2023-03-01',
    history: [
      { coordinationId: 'coord-5', quarter: '2023-Q1', startDate: '2023-03-01' },
    ],
  },
  {
    id: 'mem-5',
    name: 'Elena Rodrigues',
    email: 'elena.rodrigues@empresa.com',
    currentCoordinationId: 'coord-4',
    joinedAt: '2023-01-10',
    history: [
      { coordinationId: 'coord-2', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-1', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-6', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-4', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-6',
    name: 'Felipe Santos',
    email: 'felipe.santos@empresa.com',
    currentCoordinationId: 'coord-6',
    joinedAt: '2023-02-15',
    history: [
      { coordinationId: 'coord-3', quarter: '2023-Q1', startDate: '2023-02-15', endDate: '2023-03-31' },
      { coordinationId: 'coord-6', quarter: '2023-Q2', startDate: '2023-04-01' },
    ],
  },
  {
    id: 'mem-7',
    name: 'Gabriela Lima',
    email: 'gabriela.lima@empresa.com',
    currentCoordinationId: 'coord-1',
    joinedAt: '2023-01-05',
    history: [
      { coordinationId: 'coord-4', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-2', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-5', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-1', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-8',
    name: 'Henrique Ferreira',
    email: 'henrique.ferreira@empresa.com',
    currentCoordinationId: 'coord-2',
    joinedAt: '2023-04-01',
    history: [
      { coordinationId: 'coord-2', quarter: '2023-Q2', startDate: '2023-04-01' },
    ],
  },
];

export const quarters = [
  { label: 'Q1 2024', value: '2024-Q1' },
  { label: 'Q2 2024', value: '2024-Q2' },
  { label: 'Q3 2024', value: '2024-Q3' },
  { label: 'Q4 2024', value: '2024-Q4' },
];
