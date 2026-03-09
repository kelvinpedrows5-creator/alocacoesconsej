import { Member, Coordination, Directorate } from '@/types';

export const directorates: Directorate[] = [
  { id: 'dir-1', name: 'Demandas', description: 'Gestão e execução de demandas internas e externas' },
  { id: 'dir-2', name: 'Negócios', description: 'Desenvolvimento de negócios e parcerias estratégicas' },
  { id: 'dir-3', name: 'Presidência', description: 'Direção executiva e tomada de decisões estratégicas' },
  { id: 'dir-4', name: 'Vice-Presidência', description: 'Apoio à presidência e coordenação geral' },
  { id: 'dir-5', name: 'Marketing', description: 'Estratégias de marketing e comunicação' },
  { id: 'dir-6', name: 'Pesquisas e Pessoas', description: 'Gestão de pessoas e pesquisas organizacionais' },
];

export const coordinations: Coordination[] = [
  // Demandas
  { id: 'coord-1', name: 'Procedimentos Internos', description: 'Gestão de processos e procedimentos internos', color: '#3B82F6', directorateId: 'dir-1', maxMembers: 5 },
  { id: 'coord-2', name: 'Clientes', description: 'Atendimento e gestão de clientes', color: '#06B6D4', directorateId: 'dir-1', maxMembers: 5 },
  // Negócios
  { id: 'coord-3', name: 'Closer', description: 'Fechamento de negócios e contratos', color: '#10B981', directorateId: 'dir-2', maxMembers: 5 },
  { id: 'coord-4', name: 'Growth', description: 'Crescimento e expansão de mercado', color: '#14B8A6', directorateId: 'dir-2', maxMembers: 5 },
  // Presidência
  { id: 'coord-5', name: 'Operações', description: 'Coordenação operacional geral', color: '#8B5CF6', directorateId: 'dir-3', maxMembers: 4 },
  { id: 'coord-6', name: 'Parcerias', description: 'Desenvolvimento de parcerias estratégicas', color: '#A855F7', directorateId: 'dir-3', maxMembers: 4 },
  // Vice-Presidência
  { id: 'coord-7', name: 'Inovação', description: 'Projetos de inovação e tecnologia', color: '#F59E0B', directorateId: 'dir-4', maxMembers: 4 },
  { id: 'coord-8', name: 'Finanças', description: 'Gestão financeira e contábil', color: '#EAB308', directorateId: 'dir-4', maxMembers: 4 },
  { id: 'coord-9', name: 'Estratégia', description: 'Planejamento estratégico organizacional', color: '#F97316', directorateId: 'dir-4', maxMembers: 4 },
  // Marketing
  { id: 'coord-10', name: 'Branding', description: 'Gestão de marca e identidade visual', color: '#EC4899', directorateId: 'dir-5', maxMembers: 4 },
  { id: 'coord-11', name: 'Social Media', description: 'Gestão de redes sociais', color: '#F43F5E', directorateId: 'dir-5', maxMembers: 4 },
  { id: 'coord-12', name: 'Inbound Marketing', description: 'Marketing de atração e conteúdo', color: '#E11D48', directorateId: 'dir-5', maxMembers: 4 },
  // Pesquisas e Pessoas
  { id: 'coord-13', name: 'Pesquisas', description: 'Pesquisas e análises de mercado', color: '#84CC16', directorateId: 'dir-6', maxMembers: 4 },
  { id: 'coord-14', name: 'Desempenho', description: 'Avaliação e gestão de desempenho', color: '#22C55E', directorateId: 'dir-6', maxMembers: 4 },
  { id: 'coord-15', name: 'Experiência de Time', description: 'Cultura organizacional e experiência dos membros', color: '#16A34A', directorateId: 'dir-6', maxMembers: 4 },
];

export const members: Member[] = [
  {
    id: 'mem-1',
    name: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    currentCoordinationId: 'coord-1',
    joinedAt: '2023-01-15',
    history: [
      { coordinationId: 'coord-10', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-3', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-13', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-1', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-2',
    name: 'Bruno Costa',
    email: 'bruno.costa@empresa.com',
    currentCoordinationId: 'coord-3',
    joinedAt: '2023-02-01',
    history: [
      { coordinationId: 'coord-1', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-11', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-3', quarter: '2025-C3', startDate: '2025-07-01' },
    ],
  },
  {
    id: 'mem-3',
    name: 'Carla Mendes',
    email: 'carla.mendes@empresa.com',
    currentCoordinationId: 'coord-10',
    joinedAt: '2023-01-20',
    history: [
      { coordinationId: 'coord-13', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-10', quarter: '2025-C2', startDate: '2025-04-01' },
    ],
  },
  {
    id: 'mem-4',
    name: 'Daniel Oliveira',
    email: 'daniel.oliveira@empresa.com',
    currentCoordinationId: 'coord-9',
    joinedAt: '2023-03-01',
    history: [
      { coordinationId: 'coord-9', quarter: '2025-C1', startDate: '2025-03-01' },
    ],
  },
  {
    id: 'mem-5',
    name: 'Elena Rodrigues',
    email: 'elena.rodrigues@empresa.com',
    currentCoordinationId: 'coord-4',
    joinedAt: '2023-01-10',
    history: [
      { coordinationId: 'coord-2', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-5', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-13', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-4', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-6',
    name: 'Felipe Santos',
    email: 'felipe.santos@empresa.com',
    currentCoordinationId: 'coord-13',
    joinedAt: '2023-02-15',
    history: [
      { coordinationId: 'coord-10', quarter: '2025-C1', startDate: '2025-02-15', endDate: '2025-03-31' },
      { coordinationId: 'coord-13', quarter: '2025-C2', startDate: '2025-04-01' },
    ],
  },
  {
    id: 'mem-7',
    name: 'Gabriela Lima',
    email: 'gabriela.lima@empresa.com',
    currentCoordinationId: 'coord-5',
    joinedAt: '2023-01-05',
    history: [
      { coordinationId: 'coord-11', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-2', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-9', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-5', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-8',
    name: 'Henrique Ferreira',
    email: 'henrique.ferreira@empresa.com',
    currentCoordinationId: 'coord-14',
    joinedAt: '2023-04-01',
    history: [
      { coordinationId: 'coord-14', quarter: '2025-C2', startDate: '2025-04-01' },
    ],
  },
  {
    id: 'mem-9',
    name: 'Isabela Martins',
    email: 'isabela.martins@empresa.com',
    currentCoordinationId: 'coord-2',
    joinedAt: '2023-01-08',
    history: [
      { coordinationId: 'coord-4', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-14', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-10', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-2', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-10',
    name: 'João Pedro Alves',
    email: 'joao.alves@empresa.com',
    currentCoordinationId: 'coord-11',
    joinedAt: '2023-02-20',
    history: [
      { coordinationId: 'coord-3', quarter: '2025-C1', startDate: '2025-02-20', endDate: '2025-03-31' },
      { coordinationId: 'coord-9', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-11', quarter: '2025-C3', startDate: '2025-07-01' },
    ],
  },
  {
    id: 'mem-11',
    name: 'Larissa Souza',
    email: 'larissa.souza@empresa.com',
    currentCoordinationId: 'coord-1',
    joinedAt: '2023-01-12',
    history: [
      { coordinationId: 'coord-5', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-13', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-4', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-1', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-12',
    name: 'Marcos Ribeiro',
    email: 'marcos.ribeiro@empresa.com',
    currentCoordinationId: 'coord-3',
    joinedAt: '2023-03-15',
    history: [
      { coordinationId: 'coord-2', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-3', quarter: '2025-C3', startDate: '2025-07-01' },
    ],
  },
  {
    id: 'mem-13',
    name: 'Natália Campos',
    email: 'natalia.campos@empresa.com',
    currentCoordinationId: 'coord-14',
    joinedAt: '2023-01-25',
    history: [
      { coordinationId: 'coord-1', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-10', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-5', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-14', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-14',
    name: 'Otávio Nascimento',
    email: 'otavio.nascimento@empresa.com',
    currentCoordinationId: 'coord-4',
    joinedAt: '2023-02-05',
    history: [
      { coordinationId: 'coord-11', quarter: '2025-C1', startDate: '2025-02-05', endDate: '2025-03-31' },
      { coordinationId: 'coord-1', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-4', quarter: '2025-C3', startDate: '2025-07-01' },
    ],
  },
  {
    id: 'mem-15',
    name: 'Patrícia Gomes',
    email: 'patricia.gomes@empresa.com',
    currentCoordinationId: 'coord-9',
    joinedAt: '2023-01-18',
    history: [
      { coordinationId: 'coord-14', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-3', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-2', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-9', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-16',
    name: 'Rafael Teixeira',
    email: 'rafael.teixeira@empresa.com',
    currentCoordinationId: 'coord-10',
    joinedAt: '2023-02-28',
    history: [
      { coordinationId: 'coord-9', quarter: '2025-C1', startDate: '2025-02-28', endDate: '2025-03-31' },
      { coordinationId: 'coord-4', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-10', quarter: '2025-C3', startDate: '2025-07-01' },
    ],
  },
  {
    id: 'mem-17',
    name: 'Sofia Andrade',
    email: 'sofia.andrade@empresa.com',
    currentCoordinationId: 'coord-2',
    joinedAt: '2023-01-03',
    history: [
      { coordinationId: 'coord-13', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-5', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-11', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-2', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
  {
    id: 'mem-18',
    name: 'Thiago Barros',
    email: 'thiago.barros@empresa.com',
    currentCoordinationId: 'coord-5',
    joinedAt: '2023-03-10',
    history: [
      { coordinationId: 'coord-10', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-5', quarter: '2025-C3', startDate: '2025-07-01' },
    ],
  },
  {
    id: 'mem-19',
    name: 'Vanessa Carvalho',
    email: 'vanessa.carvalho@empresa.com',
    currentCoordinationId: 'coord-13',
    joinedAt: '2023-01-22',
    history: [
      { coordinationId: 'coord-3', quarter: '2025-C1', startDate: '2025-01-01', endDate: '2025-03-31' },
      { coordinationId: 'coord-1', quarter: '2025-C2', startDate: '2025-04-01', endDate: '2025-06-30' },
      { coordinationId: 'coord-14', quarter: '2025-C3', startDate: '2025-07-01', endDate: '2025-09-30' },
      { coordinationId: 'coord-13', quarter: '2025-C4', startDate: '2025-10-01' },
    ],
  },
];

// Cycles instead of quarters - now managed from database
// This is a fallback for when cycles haven't been loaded yet
export const cycles = [
  { label: '1º Ciclo de 2026', value: '2026-C1' },
];

// Legacy export for backwards compatibility
export const quarters = cycles;

// Profile questions for matching members to coordinations
// Category: 'consultor' = first 6 questions about consultant style
// Category: 'coordenador' = remaining 6 questions about coordination/work preferences
export type ProfileQuestionType = 'radio' | 'text' | 'compound';

export interface ProfileQuestionOption {
  value: string;
  label: string;
}

export interface ProfileQuestion {
  id: string;
  question: string;
  category: 'consultor' | 'coordenador';
  type: ProfileQuestionType;
  options?: ProfileQuestionOption[];
  subQuestions?: { id: string; label: string; type: 'radio' | 'text'; options?: ProfileQuestionOption[] }[];
}

export const profileQuestions: ProfileQuestion[] = [
  // === COORDENADOR (6 perguntas) ===
  {
    id: 'q1',
    question: 'Qual área você tem mais interesse em desenvolver habilidades?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'analytical', label: 'Análise de dados e pesquisas' },
      { value: 'creative', label: 'Criatividade e comunicação visual' },
      { value: 'people', label: 'Gestão de pessoas e relacionamentos' },
      { value: 'strategy', label: 'Planejamento e estratégia' },
      { value: 'operations', label: 'Processos e operações' },
    ],
  },
  {
    id: 'q2',
    question: 'Como você prefere trabalhar?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'autonomous', label: 'De forma autônoma e independente' },
      { value: 'collaborative', label: 'Em equipe e colaborativamente' },
      { value: 'leadership', label: 'Liderando e coordenando outros' },
      { value: 'support', label: 'Dando suporte a iniciativas existentes' },
    ],
  },
  {
    id: 'q3',
    question: 'Qual tipo de atividade mais te motiva?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'client', label: 'Contato direto com clientes' },
      { value: 'internal', label: 'Melhoria de processos internos' },
      { value: 'innovation', label: 'Criar coisas novas e inovar' },
      { value: 'analysis', label: 'Analisar dados e tomar decisões baseadas em métricas' },
      { value: 'content', label: 'Produção de conteúdo e comunicação' },
    ],
  },
  {
    id: 'q4',
    question: 'Qual competência você mais deseja desenvolver?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'negotiation', label: 'Negociação e fechamento de negócios' },
      { value: 'marketing', label: 'Marketing digital e branding' },
      { value: 'finance', label: 'Finanças e gestão orçamentária' },
      { value: 'hr', label: 'Gestão de pessoas e cultura' },
      { value: 'project', label: 'Gestão de projetos e processos' },
    ],
  },
  {
    id: 'q6',
    question: 'Qual é o seu estilo de comunicação preferido?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'direct', label: 'Direto e objetivo' },
      { value: 'detailed', label: 'Detalhado e explicativo' },
      { value: 'visual', label: 'Visual e com exemplos' },
      { value: 'informal', label: 'Informal e descontraído' },
    ],
  },
  {
    id: 'q7',
    question: 'Como você costuma resolver problemas?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'analytical_approach', label: 'Analisando dados e informações' },
      { value: 'intuitive', label: 'Confiando na intuição e experiência' },
      { value: 'collaborative_approach', label: 'Buscando opiniões de outras pessoas' },
      { value: 'experimental', label: 'Testando diferentes soluções rapidamente' },
    ],
  },
  // === CONSULTOR (5 perguntas) ===
  {
    id: 'q5',
    question: 'Em qual diretoria você tem mais interesse em atuar?',
    category: 'coordenador',
    type: 'radio',
    options: [
      { value: 'dir-1', label: 'Demandas - Procedimentos e Clientes' },
      { value: 'dir-2', label: 'Negócios - Closer e Growth' },
      { value: 'dir-3', label: 'Presidência - Operações e Parcerias' },
      { value: 'dir-4', label: 'Vice-Presidência - Inovação, Finanças e Estratégia' },
      { value: 'dir-5', label: 'Marketing - Branding, Social Media e Inbound' },
      { value: 'dir-6', label: 'Pesquisas e Pessoas - Pesquisas, Desempenho e Experiência' },
    ],
  },
  {
    id: 'q16',
    question: 'Quais desses estilos de demandas mais se alinham com a sua preferência?',
    category: 'consultor',
    type: 'radio',
    options: [
      { value: 'contratual', label: 'Contratual' },
      { value: 'civil', label: 'Civil' },
      { value: 'propriedade_industrial', label: 'Propriedade Industrial' },
      { value: 'trabalhista_societario', label: 'Trabalhista/Societário' },
    ],
  },
  {
    id: 'q17',
    question: 'Quantos momentos por dia você conseguirá estar disponível para a CONSEJ?',
    category: 'consultor',
    type: 'radio',
    options: [
      { value: '1', label: '1 momento por dia' },
      { value: '2', label: '2 momentos por dia' },
      { value: '3', label: '3 momentos por dia' },
      { value: '4_ou_mais', label: '4 ou mais momentos por dia' },
    ],
  },
  {
    id: 'q18',
    question: 'Quais escopos você mais executou, tem mais afinidades ou não gosta de executar?',
    category: 'consultor',
    type: 'compound',
    subQuestions: [
      { id: 'q18_affinity', label: 'Escopos que mais executou / tem afinidade', type: 'text' },
      { id: 'q18_dislikes', label: 'Escopos que não gosta de executar', type: 'text' },
    ],
  },
  {
    id: 'q19',
    question: 'Qual seu turno com maior disponibilidade?',
    category: 'consultor',
    type: 'radio',
    options: [
      { value: 'manha', label: 'Manhã' },
      { value: 'tarde', label: 'Tarde' },
      { value: 'noite', label: 'Noite' },
      { value: 'flexivel', label: 'Flexível (qualquer turno)' },
    ],
  },
  {
    id: 'q20',
    question: 'Existe alguma pessoa que você não gostou de trabalhar junto?',
    category: 'consultor',
    type: 'compound',
    subQuestions: [
      {
        id: 'q20_answer',
        label: 'Resposta',
        type: 'radio',
        options: [
          { value: 'nao', label: 'Não' },
          { value: 'sim', label: 'Sim' },
        ],
      },
      { id: 'q20_details', label: 'Se sim, quem e por quê? (confidencial)', type: 'text' },
    ],
  },
];

// Coordination matching weights
export const coordinationMatchingProfile: Record<string, { skills: string[], workStyle: string[], activities: string[], competencies: string[] }> = {
  'coord-1': { // Procedimentos Internos
    skills: ['operations', 'analytical'],
    workStyle: ['autonomous', 'support'],
    activities: ['internal', 'analysis'],
    competencies: ['project'],
  },
  'coord-2': { // Clientes
    skills: ['people', 'operations'],
    workStyle: ['collaborative', 'support'],
    activities: ['client'],
    competencies: ['negotiation', 'project'],
  },
  'coord-3': { // Closing
    skills: ['strategy', 'people'],
    workStyle: ['autonomous', 'leadership'],
    activities: ['client'],
    competencies: ['negotiation'],
  },
  'coord-4': { // Growth
    skills: ['strategy', 'analytical'],
    workStyle: ['autonomous', 'leadership'],
    activities: ['innovation', 'analysis'],
    competencies: ['marketing', 'negotiation'],
  },
  'coord-5': { // Operações
    skills: ['operations', 'strategy'],
    workStyle: ['leadership', 'collaborative'],
    activities: ['internal'],
    competencies: ['project'],
  },
  'coord-6': { // Parcerias
    skills: ['people', 'strategy'],
    workStyle: ['autonomous', 'leadership'],
    activities: ['client', 'innovation'],
    competencies: ['negotiation'],
  },
  'coord-7': { // Inovação
    skills: ['creative', 'analytical'],
    workStyle: ['autonomous', 'collaborative'],
    activities: ['innovation'],
    competencies: ['project', 'marketing'],
  },
  'coord-8': { // Finanças
    skills: ['analytical', 'operations'],
    workStyle: ['autonomous', 'support'],
    activities: ['analysis', 'internal'],
    competencies: ['finance'],
  },
  'coord-9': { // Estratégia
    skills: ['strategy', 'analytical'],
    workStyle: ['leadership', 'autonomous'],
    activities: ['analysis', 'innovation'],
    competencies: ['project', 'finance'],
  },
  'coord-10': { // Branding
    skills: ['creative', 'people'],
    workStyle: ['collaborative', 'autonomous'],
    activities: ['content', 'innovation'],
    competencies: ['marketing'],
  },
  'coord-11': { // Social Media
    skills: ['creative', 'people'],
    workStyle: ['collaborative', 'autonomous'],
    activities: ['content'],
    competencies: ['marketing'],
  },
  'coord-12': { // Inbound Marketing
    skills: ['creative', 'analytical'],
    workStyle: ['collaborative', 'autonomous'],
    activities: ['content', 'analysis'],
    competencies: ['marketing'],
  },
  'coord-13': { // Pesquisas
    skills: ['analytical', 'strategy'],
    workStyle: ['autonomous', 'collaborative'],
    activities: ['analysis'],
    competencies: ['project'],
  },
  'coord-14': { // Desempenho
    skills: ['people', 'analytical'],
    workStyle: ['collaborative', 'leadership'],
    activities: ['internal', 'analysis'],
    competencies: ['hr', 'project'],
  },
  'coord-15': { // Experiência de Time
    skills: ['people', 'creative'],
    workStyle: ['collaborative', 'leadership'],
    activities: ['internal', 'innovation'],
    competencies: ['hr'],
  },
};

// Allocation suggestions based on 360° algorithm
export const allocationSuggestions = [
  {
    memberId: 'mem-4',
    suggestedCoordinationId: 'coord-2',
    reason: 'Daniel possui baixa cobertura e nunca passou por Clientes',
    priority: 'high' as const,
  },
  {
    memberId: 'mem-8',
    suggestedCoordinationId: 'coord-7',
    reason: 'Henrique nunca atuou em Inovação e tem perfil compatível',
    priority: 'medium' as const,
  },
];
