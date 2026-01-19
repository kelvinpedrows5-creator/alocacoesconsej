import { Member, Coordination, Directorate } from '@/types';

export const directorates: Directorate[] = [
  { id: 'dir-1', name: 'Demandas', description: 'Gestão e execução de demandas internas e externas' },
  { id: 'dir-2', name: 'Negócios', description: 'Desenvolvimento de negócios e parcerias estratégicas' },
  { id: 'dir-3', name: 'Presidência', description: 'Direção executiva e tomada de decisões estratégicas' },
  { id: 'dir-4', name: 'Vice-Presidência', description: 'Apoio à presidência e coordenação geral' },
  { id: 'dir-5', name: 'Pesquisas e Pessoas', description: 'Gestão de pessoas e pesquisas organizacionais' },
  { id: 'dir-6', name: 'Marketing', description: 'Estratégias de marketing e comunicação' },
];

export const coordinations: Coordination[] = [
  // Demandas
  { id: 'coord-1', name: 'Projetos', description: 'Gestão de projetos estratégicos', color: '#3B82F6', directorateId: 'dir-1', maxMembers: 5 },
  { id: 'coord-2', name: 'Qualidade', description: 'Controle de qualidade das entregas', color: '#06B6D4', directorateId: 'dir-1', maxMembers: 4 },
  // Negócios
  { id: 'coord-3', name: 'Comercial', description: 'Vendas e relacionamento com clientes', color: '#10B981', directorateId: 'dir-2', maxMembers: 5 },
  { id: 'coord-4', name: 'Parcerias', description: 'Desenvolvimento de parcerias estratégicas', color: '#14B8A6', directorateId: 'dir-2', maxMembers: 4 },
  // Presidência
  { id: 'coord-5', name: 'Estratégia', description: 'Planejamento estratégico organizacional', color: '#8B5CF6', directorateId: 'dir-3', maxMembers: 3 },
  // Vice-Presidência
  { id: 'coord-6', name: 'Operações', description: 'Coordenação operacional geral', color: '#A855F7', directorateId: 'dir-4', maxMembers: 4 },
  // Pesquisas e Pessoas
  { id: 'coord-7', name: 'Capacitação', description: 'Treinamentos e desenvolvimento de membros', color: '#F59E0B', directorateId: 'dir-5', maxMembers: 4 },
  { id: 'coord-8', name: 'Pesquisa', description: 'Pesquisas e análises de mercado', color: '#EAB308', directorateId: 'dir-5', maxMembers: 4 },
  // Marketing
  { id: 'coord-9', name: 'Comunicação', description: 'Comunicação interna e externa', color: '#EC4899', directorateId: 'dir-6', maxMembers: 4 },
  { id: 'coord-10', name: 'Mídias Sociais', description: 'Gestão de redes sociais', color: '#F43F5E', directorateId: 'dir-6', maxMembers: 3 },
];

export const members: Member[] = [
  {
    id: 'mem-1',
    name: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    currentCoordinationId: 'coord-1',
    joinedAt: '2023-01-15',
    history: [
      { coordinationId: 'coord-9', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-3', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-7', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-1', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-2',
    name: 'Bruno Costa',
    email: 'bruno.costa@empresa.com',
    currentCoordinationId: 'coord-3',
    joinedAt: '2023-02-01',
    history: [
      { coordinationId: 'coord-1', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-10', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-3', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-3',
    name: 'Carla Mendes',
    email: 'carla.mendes@empresa.com',
    currentCoordinationId: 'coord-9',
    joinedAt: '2023-01-20',
    history: [
      { coordinationId: 'coord-8', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-9', quarter: '2023-Q2', startDate: '2023-04-01' },
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
      { coordinationId: 'coord-6', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-8', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-4', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-6',
    name: 'Felipe Santos',
    email: 'felipe.santos@empresa.com',
    currentCoordinationId: 'coord-8',
    joinedAt: '2023-02-15',
    history: [
      { coordinationId: 'coord-9', quarter: '2023-Q1', startDate: '2023-02-15', endDate: '2023-03-31' },
      { coordinationId: 'coord-8', quarter: '2023-Q2', startDate: '2023-04-01' },
    ],
  },
  {
    id: 'mem-7',
    name: 'Gabriela Lima',
    email: 'gabriela.lima@empresa.com',
    currentCoordinationId: 'coord-6',
    joinedAt: '2023-01-05',
    history: [
      { coordinationId: 'coord-10', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-2', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-5', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-6', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-8',
    name: 'Henrique Ferreira',
    email: 'henrique.ferreira@empresa.com',
    currentCoordinationId: 'coord-7',
    joinedAt: '2023-04-01',
    history: [
      { coordinationId: 'coord-7', quarter: '2023-Q2', startDate: '2023-04-01' },
    ],
  },
  {
    id: 'mem-9',
    name: 'Isabela Martins',
    email: 'isabela.martins@empresa.com',
    currentCoordinationId: 'coord-2',
    joinedAt: '2023-01-08',
    history: [
      { coordinationId: 'coord-4', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-7', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-9', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-2', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-10',
    name: 'João Pedro Alves',
    email: 'joao.alves@empresa.com',
    currentCoordinationId: 'coord-10',
    joinedAt: '2023-02-20',
    history: [
      { coordinationId: 'coord-3', quarter: '2023-Q1', startDate: '2023-02-20', endDate: '2023-03-31' },
      { coordinationId: 'coord-5', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-10', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-11',
    name: 'Larissa Souza',
    email: 'larissa.souza@empresa.com',
    currentCoordinationId: 'coord-1',
    joinedAt: '2023-01-12',
    history: [
      { coordinationId: 'coord-6', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-8', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-4', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-1', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-12',
    name: 'Marcos Ribeiro',
    email: 'marcos.ribeiro@empresa.com',
    currentCoordinationId: 'coord-3',
    joinedAt: '2023-03-15',
    history: [
      { coordinationId: 'coord-2', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-3', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-13',
    name: 'Natália Campos',
    email: 'natalia.campos@empresa.com',
    currentCoordinationId: 'coord-7',
    joinedAt: '2023-01-25',
    history: [
      { coordinationId: 'coord-1', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-9', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-6', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-7', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-14',
    name: 'Otávio Nascimento',
    email: 'otavio.nascimento@empresa.com',
    currentCoordinationId: 'coord-4',
    joinedAt: '2023-02-05',
    history: [
      { coordinationId: 'coord-10', quarter: '2023-Q1', startDate: '2023-02-05', endDate: '2023-03-31' },
      { coordinationId: 'coord-1', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-4', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-15',
    name: 'Patrícia Gomes',
    email: 'patricia.gomes@empresa.com',
    currentCoordinationId: 'coord-5',
    joinedAt: '2023-01-18',
    history: [
      { coordinationId: 'coord-7', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-3', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-2', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-5', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-16',
    name: 'Rafael Teixeira',
    email: 'rafael.teixeira@empresa.com',
    currentCoordinationId: 'coord-9',
    joinedAt: '2023-02-28',
    history: [
      { coordinationId: 'coord-5', quarter: '2023-Q1', startDate: '2023-02-28', endDate: '2023-03-31' },
      { coordinationId: 'coord-4', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-9', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-17',
    name: 'Sofia Andrade',
    email: 'sofia.andrade@empresa.com',
    currentCoordinationId: 'coord-2',
    joinedAt: '2023-01-03',
    history: [
      { coordinationId: 'coord-8', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-6', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-10', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-2', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
  {
    id: 'mem-18',
    name: 'Thiago Barros',
    email: 'thiago.barros@empresa.com',
    currentCoordinationId: 'coord-6',
    joinedAt: '2023-03-10',
    history: [
      { coordinationId: 'coord-9', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-6', quarter: '2023-Q3', startDate: '2023-07-01' },
    ],
  },
  {
    id: 'mem-19',
    name: 'Vanessa Carvalho',
    email: 'vanessa.carvalho@empresa.com',
    currentCoordinationId: 'coord-8',
    joinedAt: '2023-01-22',
    history: [
      { coordinationId: 'coord-3', quarter: '2023-Q1', startDate: '2023-01-01', endDate: '2023-03-31' },
      { coordinationId: 'coord-1', quarter: '2023-Q2', startDate: '2023-04-01', endDate: '2023-06-30' },
      { coordinationId: 'coord-7', quarter: '2023-Q3', startDate: '2023-07-01', endDate: '2023-09-30' },
      { coordinationId: 'coord-8', quarter: '2023-Q4', startDate: '2023-10-01' },
    ],
  },
];

export const quarters = [
  { label: 'Q1 2024', value: '2024-Q1' },
  { label: 'Q2 2024', value: '2024-Q2' },
  { label: 'Q3 2024', value: '2024-Q3' },
  { label: 'Q4 2024', value: '2024-Q4' },
];
