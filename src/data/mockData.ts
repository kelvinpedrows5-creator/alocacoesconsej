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

// Profile questions for matching members to coordinations (15 questions)
export const profileQuestions = [
  {
    id: 'q1',
    question: 'Qual área você tem mais interesse em desenvolver habilidades?',
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
    options: [
      { value: 'negotiation', label: 'Negociação e fechamento de negócios' },
      { value: 'marketing', label: 'Marketing digital e branding' },
      { value: 'finance', label: 'Finanças e gestão orçamentária' },
      { value: 'hr', label: 'Gestão de pessoas e cultura' },
      { value: 'project', label: 'Gestão de projetos e processos' },
    ],
  },
  {
    id: 'q5',
    question: 'Em qual diretoria você tem mais interesse em atuar?',
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
    id: 'q6',
    question: 'Qual é o seu estilo de comunicação preferido?',
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
    options: [
      { value: 'analytical_approach', label: 'Analisando dados e informações' },
      { value: 'intuitive', label: 'Confiando na intuição e experiência' },
      { value: 'collaborative_approach', label: 'Buscando opiniões de outras pessoas' },
      { value: 'experimental', label: 'Testando diferentes soluções rapidamente' },
    ],
  },
  {
    id: 'q8',
    question: 'Como você gerencia seu tempo e prioridades?',
    options: [
      { value: 'structured', label: 'Com listas e cronogramas detalhados' },
      { value: 'flexible', label: 'De forma flexível, adaptando conforme necessário' },
      { value: 'deadline_driven', label: 'Focado em prazos e entregas' },
      { value: 'priority_based', label: 'Priorizando o mais importante primeiro' },
    ],
  },
  {
    id: 'q9',
    question: 'Qual papel você costuma assumir em equipes?',
    options: [
      { value: 'leader_role', label: 'Líder - organizando e direcionando' },
      { value: 'executor', label: 'Executor - fazendo acontecer' },
      { value: 'ideator', label: 'Idealizador - gerando novas ideias' },
      { value: 'mediator', label: 'Mediador - conectando pessoas e ideias' },
      { value: 'specialist', label: 'Especialista - trazendo conhecimento técnico' },
    ],
  },
  {
    id: 'q10',
    question: 'Como você prefere aprender coisas novas?',
    options: [
      { value: 'hands_on', label: 'Colocando a mão na massa' },
      { value: 'reading', label: 'Lendo e estudando materiais' },
      { value: 'mentoring', label: 'Com ajuda de um mentor ou colega' },
      { value: 'courses', label: 'Através de cursos e treinamentos formais' },
    ],
  },
  {
    id: 'q11',
    question: 'Como você lida com situações de pressão?',
    options: [
      { value: 'calm', label: 'Mantenho a calma e foco no essencial' },
      { value: 'energized', label: 'Fico mais energizado e produtivo' },
      { value: 'delegate', label: 'Delego e busco apoio' },
      { value: 'plan', label: 'Reorganizo prioridades e faço um plano' },
    ],
  },
  {
    id: 'q12',
    question: 'Qual estilo de liderança você mais admira?',
    options: [
      { value: 'servant', label: 'Liderança servidora - apoiando a equipe' },
      { value: 'visionary', label: 'Liderança visionária - inspirando com propósito' },
      { value: 'democratic', label: 'Liderança democrática - decisões em conjunto' },
      { value: 'coaching', label: 'Liderança coach - desenvolvendo pessoas' },
    ],
  },
  {
    id: 'q13',
    question: 'Como você prefere receber feedback?',
    options: [
      { value: 'direct_feedback', label: 'Direto e frequente' },
      { value: 'formal', label: 'Em momentos formais e estruturados' },
      { value: 'written', label: 'Por escrito, para refletir depois' },
      { value: 'one_on_one', label: 'Em conversas individuais' },
    ],
  },
  {
    id: 'q14',
    question: 'Que tipo de projeto te atrai mais?',
    options: [
      { value: 'new_initiative', label: 'Criar algo do zero' },
      { value: 'improvement', label: 'Melhorar processos existentes' },
      { value: 'scaling', label: 'Escalar e expandir iniciativas' },
      { value: 'problem_solving', label: 'Resolver problemas complexos' },
    ],
  },
  {
    id: 'q15',
    question: 'Qual ferramenta de trabalho colaborativo você prefere?',
    options: [
      { value: 'async', label: 'Ferramentas assíncronas (email, documentos)' },
      { value: 'realtime', label: 'Comunicação em tempo real (chat, calls)' },
      { value: 'visual_tools', label: 'Ferramentas visuais (quadros, fluxos)' },
      { value: 'mixed', label: 'Combinação de diferentes ferramentas' },
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
