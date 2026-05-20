export type LessonStatus = 'novo' | 'em andamento' | 'concluido' | 'em breve'
export type AdminStatus = 'publicada' | 'rascunho' | 'em breve'
export type Level = 'básico' | 'intermediário' | 'avançado'
export type VideoSource = 'youtube' | 'upload' | 'placeholder'
export type AccessAudience = 'todos' | 'pagantes'
export type AccessMode = 'gratuita' | 'inclusa' | 'avulsa'
export type QuizQuestionType = 'multipla-escolha' | 'verdadeiro-falso'

export type QuizQuestion = {
  id: string
  prompt: string
  type: QuizQuestionType
  options: string[]
  correctAnswer: number
  explanation?: string
}

export type Teacher = {
  id: string
  name: string
  title: string
  crm: string
  bio: string
  avatar: string
  photo?: string
  lattes?: string
  credentials?: string[]
  specialties: string[]
  lessonIds: string[]
}

export type Specialty = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  status: 'ativo' | 'inativo'
  accessMode?: AccessMode
  accessAudience?: AccessAudience
  accessPrice?: string
  teacherIds: string[]
}

export type Material = {
  id: string
  title: string
  type: 'Mapa mental' | 'PDF complementar' | 'Modelo de laudo' | 'Checklist prático' | 'Resumo ilustrado' | 'Arquivo complementar'
}

export type Lesson = {
  id: string
  slug: string
  title: string
  description: string
  teacherId: string
  specialtySlug: string
  module: string
  duration: string
  status: LessonStatus
  adminStatus: AdminStatus
  releaseDate: string
  progress: number
  views: number
  tags: string[]
  materials: Material[]
  learning: string[]
  thumbnail: string
  featured?: boolean
  videoUrl?: string
  videoSource?: VideoSource
  videoAssetId?: string
  videoAssetName?: string
  coverImage?: string
  quizTitle?: string
  quizQuestions?: Array<QuizQuestion | string>
  accessMode?: AccessMode | 'herdar'
  accessAudience?: AccessAudience
  accessPrice?: string
}

export type ReportTemplate = {
  id: string
  title: string
  category: string
  description: string
  content: string
  status: 'publicado' | 'rascunho'
}

export type CaseStudy = {
  id: string
  slug: string
  title: string
  specialtySlug: string
  level: Level
  description: string
  history: string
  findings: string
  hypothesis: string
  discussion: string
  thumbnail: string
  status: 'publicado' | 'rascunho'
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  time?: string
  endTime?: string
  type: 'Aula liberada' | 'Live' | 'Encontro presencial' | 'Estudo de caso' | 'Prova/simulado' | 'Prazo de certificado'
  teacherId?: string
  coordinatorId?: string
  guestNames?: string[]
  lessonId?: string
  platform?: 'Zoom' | 'YouTube' | 'Google Meet' | 'Presencial'
  liveLink?: string
  image?: string
  accessMode?: 'gratuita' | 'inclusa' | 'avulsa'
  accessPrice?: string
  description: string
}

export type Student = {
  id: string
  name: string
  email: string
  status: 'ativo' | 'inativo'
  plan: 'Aluno individual' | 'Turma presencial' | 'Assinatura mensal' | 'Acesso vitalício' | 'Professor/Admin'
  progress: number
  lastAccess: string
  points: number
  completedLessons: number
  comments: number
  badges: string[]
  interest: string
}

export type SupportTicket = {
  id: string
  subject: string
  category: string
  status: 'aberto' | 'respondido' | 'em análise'
  date: string
  message: string
}

export type Certificate = {
  id: string
  title: string
  module: string
  specialtySlug: string
  teacherId: string
  status: 'disponível' | 'em andamento'
  progress: number
  hours: string
  issueDate?: string
  certificateCode: string
  summary: string
}

export type LessonComment = {
  id: string
  lessonId: string
  author: string
  role: 'aluno' | 'professor'
  message: string
  date: string
  status: 'respondido' | 'pendente'
}

export const teachers: Teacher[] = [
  {
    id: 'antonio-gadelha',
    name: 'Prof. Dr. Antônio Gadelha',
    title: 'Radiologista e coordenador científico',
    crm: 'CRM 18427-CE',
    bio: 'Mestre, Doutor e Pós-Doutor pela USP, presidente da APBUS, membro da Academia Brasileira de Ultrassonografia e referência nacional em ultrassonografia.',
    avatar: 'AG',
    photo: '/people/antonio-gadelha.png',
    lattes: 'http://lattes.cnpq.br/0388242608904648',
    credentials: [
      'Mestre, Doutor e Pós-Doutor pela USP',
      'Presidente da Associação Paraibana de Ultrassonografia',
      'Especialista em Ultrassonografia Geral pelo CBR/AMB',
      'Especialista em Ginecologia e Obstetrícia pela FEBRASGO/AMB',
    ],
    specialties: ['Doppler', 'Abdome', 'POCUS'],
    lessonIds: ['doppler-fundamentos', 'doppler-carotidas', 'abdome-total'],
  },
  {
    id: 'patricia-gadelha',
    name: 'Profª Dra. Patrícia Gadelha',
    title: 'Ginecologista e especialista em medicina fetal',
    crm: 'CRM 19206-CE',
    bio: 'Mestre e Doutora pela USP, referência em ultrassonografia ginecológica, obstétrica e medicina fetal, com atuação científica na APBUS.',
    avatar: 'PG',
    photo: '/people/patricia-gadelha.png',
    lattes: 'https://lattes.cnpq.br/1196217025300715',
    credentials: [
      'Mestre e Doutora pela USP',
      'Referência em ultrassonografia em ginecologia e obstetrícia',
      'Títulos reconhecidos por FEBRASGO, CBR e AMB',
      'Diretora Científica da APBUS',
    ],
    specialties: ['Ginecologia e Obstetrícia', 'Medicina Interna'],
    lessonIds: ['endometriose-profunda', 'morfo-primeiro-trimestre', 'doppler-obstetrico'],
  },
  {
    id: 'guilherme-porto',
    name: 'Dr. Guilherme Porto',
    title: 'Médico com atuação em ultrassonografia e medicina fetal',
    crm: '',
    bio: 'Médico com atuação nas áreas de ultrassonografia e medicina fetal, com experiência voltada ao diagnóstico por imagem em saúde materno-fetal.',
    avatar: 'GP',
    specialties: ['Mama', 'Ginecologia e Obstetrícia'],
    lessonIds: ['birads-mamaria'],
  },
  {
    id: 'isaac-newton-guimaraes',
    name: 'Dr. Isaac Newton Guimarães',
    title: 'Cirurgião com atuação acadêmica e clínica',
    crm: '',
    bio: 'Mestre e Doutor em Cirurgia, com experiência clínica e acadêmica voltada para formação médica e aplicações guiadas por imagem.',
    avatar: 'IG',
    specialties: ['Tireoide', 'Partes Moles', 'Medicina Interna'],
    lessonIds: ['tireoide-nodulos'],
  },
  {
    id: 'armando-mendes',
    name: 'Dr. Armando Mendes',
    title: 'Médico anestesiologista com experiência em ultrassom guiado',
    crm: '',
    bio: 'Médico anestesiologista com atuação em emergência e procedimentos guiados por ultrassonografia, com participação ativa em jornadas científicas da especialidade.',
    avatar: 'AM',
    specialties: ['POCUS', 'Doppler'],
    lessonIds: ['pocus-atendimento'],
  },
  {
    id: 'melissa-diesel',
    name: 'Dra. Melissa Diesel',
    title: 'Ginecologista e obstetra com formação em medicina fetal',
    crm: '',
    bio: 'Especialista em ginecologia, obstetrícia e ultrassom, com formação em medicina fetal e experiência em ensino médico continuado.',
    avatar: 'MD',
    specialties: ['Partes Moles', 'Mama', 'Ginecologia e Obstetrícia'],
    lessonIds: ['partes-moles'],
  },
]

export const specialties: Specialty[] = [
  {
    id: 'gineco-obstetricia',
    slug: 'ginecologia-obstetricia',
    name: 'Ginecologia e Obstetrícia',
    description:
      'Trilhas práticas para avaliação pélvica, obstétrica, endometriose, doppler obstétrico e documentação de achados.',
    icon: 'Baby',
    color: '#0f6b9f',
    order: 1,
    status: 'ativo',
    teacherIds: ['patricia-gadelha'],
  },
  {
    id: 'doppler',
    slug: 'doppler',
    name: 'Doppler',
    description:
      'Protocolos, ajustes de máquina, espectros e interpretação de fluxos arteriais, venosos e obstétricos.',
    icon: 'Activity',
    color: '#075985',
    order: 2,
    status: 'ativo',
    teacherIds: ['antonio-gadelha', 'rafael-lima'],
  },
  {
    id: 'abdome',
    slug: 'abdome',
    name: 'Abdome',
    description:
      'Rotina do abdome total, achados frequentes, armadilhas diagnósticas e padronização do laudo.',
    icon: 'ScanLine',
    color: '#0e7490',
    order: 3,
    status: 'ativo',
    teacherIds: ['antonio-gadelha'],
  },
  {
    id: 'mama',
    slug: 'mama',
    name: 'Mama',
    description:
      'Ultrassonografia mamária, BI-RADS, avaliação complementar, linfonodos e comunicação de risco.',
    icon: 'Ribbon',
    color: '#155e75',
    order: 4,
    status: 'ativo',
    teacherIds: ['fabio-magalhaes', 'marina-costa'],
  },
  {
    id: 'tireoide',
    slug: 'tireoide',
    name: 'Tireoide',
    description:
      'Nódulos, tireoidites, Doppler, classificação de risco e orientação para seguimento clínico.',
    icon: 'Sparkles',
    color: '#0369a1',
    order: 5,
    status: 'ativo',
    teacherIds: ['sofia-cartacho'],
  },
  {
    id: 'pocus',
    slug: 'pocus',
    name: 'POCUS',
    description:
      'Protocolos à beira-leito para emergência, avaliação inicial, pulmão, FAST e tomada de decisão rápida.',
    icon: 'Cross',
    color: '#047857',
    order: 6,
    status: 'ativo',
    teacherIds: ['rafael-lima'],
  },
  {
    id: 'medicina-interna',
    slug: 'medicina-interna',
    name: 'Medicina Interna',
    description:
      'Aplicações integradas da ultrassonografia na investigação clínica longitudinal e acompanhamento terapêutico.',
    icon: 'Stethoscope',
    color: '#1d4ed8',
    order: 7,
    status: 'ativo',
    teacherIds: ['patricia-gadelha', 'sofia-cartacho'],
  },
  {
    id: 'partes-moles',
    slug: 'partes-moles',
    name: 'Partes Moles',
    description:
      'Lesões superficiais, documentação anatômica, diferenciação de coleções, lipomas e alterações inflamatórias.',
    icon: 'Layers3',
    color: '#0f766e',
    order: 8,
    status: 'ativo',
    teacherIds: ['marina-costa'],
  },
]

export const lessons: Lesson[] = [
  {
    id: 'doppler-fundamentos',
    slug: 'fundamentos-do-doppler',
    title: 'Fundamentos do Doppler',
    description:
      'Ajustes essenciais de PRF, ganho, ângulo de insonação e interpretação inicial dos padrões de fluxo.',
    teacherId: 'antonio-gadelha',
    specialtySlug: 'doppler',
    module: 'Módulo 01 - Bases técnicas',
    duration: '42 min',
    status: 'em andamento',
    adminStatus: 'publicada',
    releaseDate: '2026-05-06',
    progress: 62,
    views: 1284,
    tags: ['Doppler', 'PRF', 'fluxo', 'hemodinâmica'],
    thumbnail: 'doppler',
    featured: true,
    videoUrl: 'https://www.youtube.com/watch?v=mjrVOHPY6gs',
    videoSource: 'youtube',
    materials: [
      { id: 'm1', title: 'Mapa mental de ajustes Doppler', type: 'Mapa mental' },
      { id: 'm2', title: 'Checklist prático de espectro', type: 'Checklist prático' },
      { id: 'm3', title: 'Resumo ilustrado de padrões de fluxo', type: 'Resumo ilustrado' },
    ],
    quizTitle: 'Quiz final - Fundamentos do Doppler',
    quizQuestions: [
      {
        id: 'quiz-doppler-1',
        prompt: 'Quando o PRF está muito baixo em relação à velocidade do fluxo, o aliasing tende a aparecer com mais facilidade.',
        type: 'verdadeiro-falso',
        options: ['Verdadeiro', 'Falso'],
        correctAnswer: 0,
        explanation: 'PRF baixo demais reduz a escala de velocidade e favorece aliasing em fluxos mais rápidos.',
      },
      {
        id: 'quiz-doppler-2',
        prompt: 'Qual ajuste ajuda a reduzir aliasing em um espectro Doppler arterial?',
        type: 'multipla-escolha',
        options: ['Diminuir ainda mais o PRF', 'Aumentar o PRF/escala', 'Fechar totalmente o ganho', 'Retirar o cursor do vaso'],
        correctAnswer: 1,
        explanation: 'Na prática, aumentar o PRF ou a escala costuma ser uma das primeiras medidas para controlar aliasing.',
      },
      {
        id: 'quiz-doppler-3',
        prompt: 'O ângulo de insonação deve ser corrigido e, idealmente, mantido dentro de um intervalo técnico adequado para não distorcer a velocidade medida.',
        type: 'verdadeiro-falso',
        options: ['Verdadeiro', 'Falso'],
        correctAnswer: 0,
        explanation: 'Sem correção angular adequada, a medida de velocidade perde confiabilidade e pode induzir erro de interpretação.',
      },
    ],
    learning: [
      'Configurar ganho, escala e filtro de parede com segurança',
      'Evitar artefatos comuns na aquisição espectral',
      'Reconhecer padrões arteriais e venosos básicos',
    ],
  },
  {
    id: 'doppler-carotidas',
    slug: 'doppler-de-carotidas-na-pratica',
    title: 'Doppler de Carótidas na Prática',
    description:
      'Passo a passo de varredura, medidas de velocidade, documentação e critérios de estenose carotídea.',
    teacherId: 'antonio-gadelha',
    specialtySlug: 'doppler',
    module: 'Módulo 02 - Vascular',
    duration: '58 min',
    status: 'novo',
    adminStatus: 'publicada',
    releaseDate: '2026-05-13',
    progress: 0,
    views: 936,
    tags: ['Doppler', 'carótidas', 'estenose', 'vascular'],
    thumbnail: 'vascular',
    videoUrl: 'https://www.youtube.com/watch?v=AW1LszuemYI',
    videoSource: 'youtube',
    materials: [
      { id: 'm4', title: 'Tabela de velocidades carotídeas', type: 'PDF complementar' },
      { id: 'm5', title: 'Modelo de laudo carotídeo', type: 'Modelo de laudo' },
    ],
    learning: [
      'Planejar a sequência de aquisição do exame',
      'Relacionar velocidades com graus de estenose',
      'Escrever conclusões úteis para a decisão clínica',
    ],
  },
  {
    id: 'birads-mamaria',
    slug: 'bi-rads-na-ultrassonografia-mamaria',
    title: 'BI-RADS na Ultrassonografia Mamária',
    description:
      'Uso prático do léxico BI-RADS, categorização de lesões e comunicação objetiva com mastologia.',
    teacherId: 'guilherme-porto',
    specialtySlug: 'mama',
    module: 'Módulo 01 - Imagem mamária',
    duration: '51 min',
    status: 'em andamento',
    adminStatus: 'publicada',
    releaseDate: '2026-05-08',
    progress: 34,
    views: 1650,
    tags: ['BI-RADS', 'mama', 'nódulo', 'laudo'],
    thumbnail: 'mama',
    featured: true,
    materials: [
      { id: 'm6', title: 'Mapa mental BI-RADS ultrassonográfico', type: 'Mapa mental' },
      { id: 'm7', title: 'Modelo de laudo mamário', type: 'Modelo de laudo' },
      { id: 'm8', title: 'PDF complementar de descritores', type: 'PDF complementar' },
    ],
    learning: [
      'Aplicar descritores de forma padronizada',
      'Diferenciar categorias 3, 4A, 4B e 4C',
      'Conectar achados com recomendação de conduta',
    ],
  },
  {
    id: 'endometriose-profunda',
    slug: 'endometriose-profunda-achados-ultrassonograficos',
    title: 'Endometriose Profunda: Achados Ultrassonográficos',
    description:
      'Avaliação compartimental, sinais indiretos, preparo, documentação e correlação com sintomas.',
    teacherId: 'patricia-gadelha',
    specialtySlug: 'ginecologia-obstetricia',
    module: 'Módulo 03 - Ginecologia avançada',
    duration: '1h 12min',
    status: 'novo',
    adminStatus: 'publicada',
    releaseDate: '2026-05-15',
    progress: 0,
    views: 1107,
    tags: ['endometriose', 'ginecologia', 'DIE', 'pélvico'],
    thumbnail: 'gineco',
    materials: [
      { id: 'm9', title: 'Checklist de compartimentos', type: 'Checklist prático' },
      { id: 'm10', title: 'Modelo de laudo de endometriose', type: 'Modelo de laudo' },
    ],
    learning: [
      'Estruturar avaliação por compartimentos',
      'Reconhecer sinais sugestivos de aderências',
      'Relatar achados com linguagem cirúrgica útil',
    ],
  },
  {
    id: 'morfo-primeiro-trimestre',
    slug: 'ultrassom-morfologico-do-primeiro-trimestre',
    title: 'Ultrassom Morfológico do Primeiro Trimestre',
    description:
      'Janelas anatômicas, marcadores, biometria e documentação adequada do exame entre 11 e 14 semanas.',
    teacherId: 'patricia-gadelha',
    specialtySlug: 'ginecologia-obstetricia',
    module: 'Módulo 01 - Obstetrícia',
    duration: '1h 05min',
    status: 'concluido',
    adminStatus: 'publicada',
    releaseDate: '2026-04-25',
    progress: 100,
    views: 1488,
    tags: ['obstetrícia', 'morfológico', 'primeiro trimestre'],
    thumbnail: 'obstetrico',
    materials: [
      { id: 'm11', title: 'Resumo ilustrado 11-14 semanas', type: 'Resumo ilustrado' },
      { id: 'm12', title: 'PDF complementar de medidas', type: 'PDF complementar' },
    ],
    learning: [
      'Realizar biometria com técnica reprodutível',
      'Documentar marcadores do primeiro trimestre',
      'Reconhecer achados que exigem encaminhamento',
    ],
  },
  {
    id: 'tireoide-nodulos',
    slug: 'tireoide-nodulos-e-classificacao',
    title: 'Tireoide: Nódulos e Classificação',
    description:
      'Estratificação de risco, padrões ecográficos, Doppler, seguimento e comunicação com endocrinologia.',
    teacherId: 'isaac-newton-guimaraes',
    specialtySlug: 'tireoide',
    module: 'Módulo 01 - Nódulos',
    duration: '49 min',
    status: 'em andamento',
    adminStatus: 'publicada',
    releaseDate: '2026-05-02',
    progress: 78,
    views: 1240,
    tags: ['tireoide', 'nódulos', 'TIRADS', 'Doppler'],
    thumbnail: 'tireoide',
    materials: [
      { id: 'm13', title: 'Tabela TIRADS simplificada', type: 'PDF complementar' },
      { id: 'm14', title: 'Modelo de laudo tireoidiano', type: 'Modelo de laudo' },
    ],
    learning: [
      'Descrever composição, ecogenicidade e margens',
      'Aplicar classificação de risco na prática',
      'Sugerir seguimento de forma clara no laudo',
    ],
  },
  {
    id: 'abdome-total',
    slug: 'abdome-total-rotina-e-principais-achados',
    title: 'Abdome Total: Rotina e Principais Achados',
    description:
      'Roteiro completo de varredura, achados incidentais relevantes e armadilhas na rotina ambulatorial.',
    teacherId: 'antonio-gadelha',
    specialtySlug: 'abdome',
    module: 'Módulo 01 - Rotina abdominal',
    duration: '54 min',
    status: 'novo',
    adminStatus: 'publicada',
    releaseDate: '2026-05-10',
    progress: 0,
    views: 1420,
    tags: ['abdome', 'fígado', 'vesícula', 'rim'],
    thumbnail: 'abdome',
    videoUrl: 'https://www.youtube.com/watch?v=jOID-tYlAN4',
    videoSource: 'youtube',
    materials: [
      { id: 'm15', title: 'Checklist de abdome total', type: 'Checklist prático' },
      { id: 'm16', title: 'Modelo de laudo abdome total', type: 'Modelo de laudo' },
    ],
    learning: [
      'Organizar a rotina de varredura completa',
      'Diferenciar achados que mudam conduta',
      'Padronizar o laudo sem perder relevância clínica',
    ],
  },
  {
    id: 'pocus-atendimento',
    slug: 'pocus-no-atendimento-inicial',
    title: 'POCUS no Atendimento Inicial',
    description:
      'Aplicação rápida de FAST, pulmão, avaliação cardíaca básica e integração com sinais clínicos.',
    teacherId: 'armando-mendes',
    specialtySlug: 'pocus',
    module: 'Módulo 01 - Emergência',
    duration: '46 min',
    status: 'novo',
    adminStatus: 'publicada',
    releaseDate: '2026-05-12',
    progress: 0,
    views: 812,
    tags: ['POCUS', 'emergência', 'FAST', 'pulmão'],
    thumbnail: 'pocus',
    materials: [
      { id: 'm17', title: 'Fluxograma POCUS inicial', type: 'Mapa mental' },
      { id: 'm18', title: 'Checklist FAST', type: 'Checklist prático' },
    ],
    learning: [
      'Selecionar protocolo conforme cenário clínico',
      'Documentar achados rápidos sem excesso de texto',
      'Reconhecer limites do exame à beira-leito',
    ],
  },
  {
    id: 'doppler-obstetrico',
    slug: 'doppler-obstetrico',
    title: 'Doppler Obstétrico',
    description:
      'Artéria uterina, umbilical e cerebral média: técnica, índices e interpretação em contexto clínico.',
    teacherId: 'patricia-gadelha',
    specialtySlug: 'ginecologia-obstetricia',
    module: 'Módulo 02 - Doppler obstétrico',
    duration: '57 min',
    status: 'em breve',
    adminStatus: 'em breve',
    releaseDate: '2026-05-29',
    progress: 0,
    views: 0,
    tags: ['Doppler', 'obstetrícia', 'uterina', 'umbilical'],
    thumbnail: 'obstetrico',
    materials: [
      { id: 'm19', title: 'Resumo de índices obstétricos', type: 'Resumo ilustrado' },
      { id: 'm20', title: 'Modelo de laudo Doppler obstétrico', type: 'Modelo de laudo' },
    ],
    learning: [
      'Adquirir espectros adequados em vasos fetais',
      'Interpretar índices com base na idade gestacional',
      'Indicar quando há necessidade de vigilância',
    ],
  },
  {
    id: 'puberdade-precoce',
    slug: 'puberdade-precoce-avaliacao-ultrassonografica',
    title: 'Puberdade Precoce: Avaliação Ultrassonográfica',
    description:
      'Medidas uterinas e ovarianas, maturação folicular e integração com a investigação endocrinológica.',
    teacherId: 'patricia-gadelha',
    specialtySlug: 'ginecologia-obstetricia',
    module: 'Módulo 04 - Pediatria ginecológica',
    duration: '38 min',
    status: 'novo',
    adminStatus: 'publicada',
    releaseDate: '2026-05-17',
    progress: 0,
    views: 620,
    tags: ['puberdade precoce', 'pélvico', 'pediatria'],
    thumbnail: 'gineco',
    materials: [
      { id: 'm21', title: 'Tabela de referência pélvica pediátrica', type: 'PDF complementar' },
      { id: 'm22', title: 'Modelo de laudo pélvico infantil', type: 'Modelo de laudo' },
    ],
    learning: [
      'Mensurar útero e ovários de forma reprodutível',
      'Reconhecer sinais de estrogenização',
      'Comunicar achados para endocrinologia pediátrica',
    ],
  },
  {
    id: 'sonoembriologia',
    slug: 'sonoembriologia-aplicada',
    title: 'Sonoembriologia Aplicada',
    description:
      'Construção anatômica do primeiro trimestre por imagem, com foco em raciocínio morfológico.',
    teacherId: 'patricia-gadelha',
    specialtySlug: 'ginecologia-obstetricia',
    module: 'Módulo 05 - Medicina fetal',
    duration: '44 min',
    status: 'em breve',
    adminStatus: 'em breve',
    releaseDate: '2026-06-07',
    progress: 0,
    views: 0,
    tags: ['sonoembriologia', 'obstetrícia', 'medicina fetal'],
    thumbnail: 'obstetrico',
    materials: [{ id: 'm23', title: 'Mapa temporal de embriologia', type: 'Mapa mental' }],
    learning: [
      'Conectar desenvolvimento embrionário com imagem',
      'Reconhecer marcos anatômicos precoces',
      'Melhorar a documentação do exame morfológico',
    ],
  },
  {
    id: 'partes-moles',
    slug: 'lesoes-de-partes-moles',
    title: 'Lesões de Partes Moles',
    description:
      'Avaliação de lipomas, coleções, hérnias superficiais, corpos estranhos e documentação anatômica.',
    teacherId: 'melissa-diesel',
    specialtySlug: 'partes-moles',
    module: 'Módulo 01 - Superficial',
    duration: '41 min',
    status: 'novo',
    adminStatus: 'publicada',
    releaseDate: '2026-05-16',
    progress: 0,
    views: 702,
    tags: ['partes moles', 'lipoma', 'coleção', 'músculo'],
    thumbnail: 'partes',
    materials: [
      { id: 'm24', title: 'Checklist de lesões superficiais', type: 'Checklist prático' },
      { id: 'm25', title: 'Modelo de laudo partes moles', type: 'Modelo de laudo' },
    ],
    learning: [
      'Descrever topografia e relação com planos anatômicos',
      'Diferenciar coleções de lesões sólidas frequentes',
      'Padronizar medidas e impressão diagnóstica',
    ],
  },
]

export const reportTemplates: ReportTemplate[] = [
  {
    id: 'laudo-abdome-total',
    title: 'Abdome total com achados habituais',
    category: 'Abdome total',
    description: 'Modelo completo para rotina ambulatorial com campos editáveis por órgão.',
    status: 'publicado',
    content:
      'Fígado com dimensões preservadas, contornos regulares e ecotextura homogênea. Vesícula biliar normodistendida, paredes finas, sem cálculos. Vias biliares intra e extra-hepáticas sem dilatação. Pâncreas sem alterações ecográficas evidentes nas porções avaliadas. Baço de dimensões preservadas. Rins tópicos, com dimensões e ecogenicidade habituais, sem hidronefrose. Bexiga com repleção adequada, paredes regulares. Impressão: exame ultrassonográfico abdominal sem alterações significativas no momento.',
  },
  {
    id: 'laudo-tireoide-tirads',
    title: 'Tireoide com nódulo e classificação TIRADS',
    category: 'Tireoide',
    description: 'Texto estruturado para nódulos, medidas, características e recomendação.',
    status: 'publicado',
    content:
      'Tireoide tópica, com volume preservado. Parênquima de ecotextura discretamente heterogênea. Observa-se nódulo sólido, hipoecoico, mais largo que alto, margens regulares, sem focos ecogênicos suspeitos, medindo 0,9 x 0,7 x 0,6 cm no lobo direito. Classificação sugerida: ACR TI-RADS 4. Ausência de linfonodomegalias cervicais suspeitas. Sugere-se correlação clínica e seguimento conforme diretriz vigente.',
  },
  {
    id: 'laudo-mama-birads',
    title: 'Ultrassonografia mamária BI-RADS',
    category: 'Mama',
    description: 'Modelo com léxico BI-RADS para nódulo sólido provavelmente benigno.',
    status: 'publicado',
    content:
      'Mamas com ecotextura fibroglandular preservada. Na mama esquerda, às 3 horas, distando 2 cm do mamilo, identifica-se nódulo oval, circunscrito, hipoecoico, paralelo à pele, medindo 0,8 cm. Não há distorção arquitetural ou linfonodos axilares suspeitos. Impressão: achado provavelmente benigno. Categoria BI-RADS 3. Recomenda-se controle ultrassonográfico em 6 meses, conforme contexto clínico.',
  },
  {
    id: 'laudo-obstetrico-1t',
    title: 'Obstétrico primeiro trimestre',
    category: 'Obstétrico',
    description: 'Laudo para idade gestacional inicial, vitalidade e biometria básica.',
    status: 'publicado',
    content:
      'Útero gravídico contendo saco gestacional único, tópico, com embrião apresentando batimentos cardíacos presentes. Comprimento cabeça-nádega compatível com idade gestacional estimada. Vesícula vitelínica de aspecto habitual. Colo uterino fechado. Ovários sem alterações ecográficas relevantes. Impressão: gestação única tópica, evolutiva, compatível com a idade gestacional estimada pelos dados biométricos.',
  },
  {
    id: 'laudo-doppler-carotidas',
    title: 'Doppler de carótidas e vertebrais',
    category: 'Doppler',
    description: 'Estrutura para velocidades, placas e conclusão vascular.',
    status: 'publicado',
    content:
      'Artérias carótidas comuns, internas e externas pérvias, com fluxo de padrão habitual. Observam-se placas ateromatosas parietais discretas, sem repercussão hemodinâmica significativa. Velocidades sistólicas e razões compatíveis com ausência de estenose significativa nas carótidas internas. Artérias vertebrais com fluxo anterógrado bilateral. Impressão: ateromatose carotídea discreta, sem sinais de estenose hemodinamicamente significativa.',
  },
  {
    id: 'laudo-pelvico',
    title: 'Ultrassonografia pélvica transvaginal',
    category: 'Pélvico',
    description: 'Modelo para útero, endométrio, ovários e fundo de saco.',
    status: 'publicado',
    content:
      'Útero em anteversoflexão, dimensões preservadas, contornos regulares e miométrio homogêneo. Endométrio centrado, medindo 0,6 cm, aspecto compatível com a fase do ciclo informada. Ovários tópicos, com volume preservado e folículos periféricos habituais. Ausência de líquido livre significativo em fundo de saco. Impressão: exame pélvico sem alterações ecográficas significativas.',
  },
  {
    id: 'laudo-partes-moles',
    title: 'Lesão de partes moles superficial',
    category: 'Partes moles',
    description: 'Texto para nódulo subcutâneo, lipoma e diferenciais simples.',
    status: 'publicado',
    content:
      'Na topografia referida pelo paciente, identifica-se formação ovalada, bem delimitada, isoecoica em relação ao tecido adiposo adjacente, localizada no plano subcutâneo, medindo 2,1 x 1,0 x 0,8 cm, sem vascularização significativa ao Doppler. Não há coleções ou sinais inflamatórios adjacentes. Impressão: achado ecográfico sugestivo de lipoma subcutâneo, recomendando correlação clínica.',
  },
]

export const caseStudies: CaseStudy[] = [
  {
    id: 'caso-birads-4a',
    slug: 'nodulo-mamario-birads-4a',
    title: 'Nódulo mamário BI-RADS 4A em paciente de 42 anos',
    specialtySlug: 'mama',
    level: 'intermediário',
    description: 'Caso de correlação entre descritores ultrassonográficos e indicação de biópsia.',
    history: 'Paciente de 42 anos, sem história familiar relevante, encaminhada após palpação de pequeno nódulo em quadrante superior externo da mama direita.',
    findings:
      'Nódulo oval, hipoecoico, com margens parcialmente indistintas, orientação paralela e vascularização periférica discreta ao Doppler.',
    hypothesis: 'Lesão de baixa suspeição, categoria BI-RADS 4A, com indicação de estudo histológico.',
    discussion:
      'O caso reforça que margens não circunscritas deslocam a categoria mesmo quando outros descritores parecem favoráveis. A recomendação deve ser objetiva e alinhada à mastologia.',
    thumbnail: 'mama',
    status: 'publicado',
  },
  {
    id: 'caso-endometriose',
    slug: 'endometriose-retrocervical',
    title: 'Endometriose retrocervical com sinal de deslizamento negativo',
    specialtySlug: 'ginecologia-obstetricia',
    level: 'avançado',
    description: 'Avaliação compartimental em paciente com dismenorreia intensa e dor pélvica crônica.',
    history:
      'Paciente de 34 anos, nuligesta, com dismenorreia incapacitante, dispareunia profunda e dor evacuatória cíclica.',
    findings:
      'Espessamento hipoecoico retrocervical, aderência posterior, ovário esquerdo fixo e sinal de deslizamento negativo.',
    hypothesis: 'Endometriose profunda com acometimento retrocervical e suspeita de aderências pélvicas.',
    discussion:
      'A descrição orientada por compartimentos facilita o planejamento cirúrgico. O laudo deve indicar extensão, mobilidade e relação com estruturas adjacentes.',
    thumbnail: 'gineco',
    status: 'publicado',
  },
  {
    id: 'caso-doppler-carotida',
    slug: 'estenose-carotidea-moderada',
    title: 'Estenose carotídea moderada em paciente assintomático',
    specialtySlug: 'doppler',
    level: 'intermediário',
    description: 'Interpretação de velocidades e razão sistólica em placa ateromatosa.',
    history: 'Paciente de 68 anos, hipertenso e diabético, em rastreio vascular por sopro cervical.',
    findings:
      'Placa mista em bulbo carotídeo direito, PSV de 172 cm/s na carótida interna e razão ICA/CCA de 2,4.',
    hypothesis: 'Estenose moderada da carótida interna direita, sem sinais de suboclusão.',
    discussion:
      'Velocidades isoladas podem superestimar estenose em tortuosidades. A conclusão deve integrar imagem, espectro e razão de velocidades.',
    thumbnail: 'vascular',
    status: 'publicado',
  },
  {
    id: 'caso-tireoide-tirads',
    slug: 'nodulo-tireoide-tirads-5',
    title: 'Nódulo tireoidiano TI-RADS 5 com microcalcificações',
    specialtySlug: 'tireoide',
    level: 'avançado',
    description: 'Estratificação de risco e indicação de punção em nódulo suspeito.',
    history: 'Paciente de 51 anos, assintomática, com achado incidental em exame de rotina.',
    findings:
      'Nódulo sólido hipoecoico, mais alto que largo, margens irregulares e focos ecogênicos puntiformes no lobo esquerdo.',
    hypothesis: 'Nódulo de alta suspeição, compatível com TI-RADS 5, com indicação de PAAF conforme tamanho.',
    discussion:
      'A linguagem do laudo deve ser precisa e evitar conclusões alarmistas. O risco é comunicado por classificação e recomendação padronizada.',
    thumbnail: 'tireoide',
    status: 'publicado',
  },
  {
    id: 'caso-pocus-fast',
    slug: 'fast-positivo-trauma',
    title: 'FAST positivo no trauma abdominal fechado',
    specialtySlug: 'pocus',
    level: 'básico',
    description: 'Uso do POCUS para priorizar conduta em sala de emergência.',
    history: 'Paciente politraumatizado, hipotenso, admitido após colisão automobilística.',
    findings:
      'Líquido livre em espaço hepatorrenal e pelve, com janela subxifoide sem derrame pericárdico evidente.',
    hypothesis: 'FAST positivo, sugerindo hemoperitônio no contexto traumático.',
    discussion:
      'O exame não busca diagnóstico etiológico detalhado; seu valor está na integração com instabilidade e decisão de abordagem imediata.',
    thumbnail: 'pocus',
    status: 'publicado',
  },
  {
    id: 'caso-partes-moles',
    slug: 'colecao-subcutanea-pos-procedimento',
    title: 'Coleção subcutânea pós-procedimento',
    specialtySlug: 'partes-moles',
    level: 'básico',
    description: 'Diferenciação entre coleção, hematoma organizado e massa sólida superficial.',
    history: 'Paciente com abaulamento doloroso em parede abdominal após procedimento local há 10 dias.',
    findings:
      'Coleção alongada no subcutâneo, conteúdo heterogêneo, sem fluxo interno ao Doppler, com discreto edema adjacente.',
    hypothesis: 'Coleção pós-procedimento, podendo corresponder a hematoma em organização.',
    discussion:
      'A presença ou ausência de fluxo interno e compressibilidade ajuda a separar coleção de lesão sólida vascularizada.',
    thumbnail: 'partes',
    status: 'publicado',
  },
]

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Liberação: Doppler de Carótidas na Prática',
    date: '2026-05-13',
    type: 'Aula liberada',
    teacherId: 'antonio-gadelha',
    lessonId: 'doppler-carotidas',
    description: 'Nova aula liberada para a trilha Doppler vascular.',
  },
  {
    id: 'ev-2',
    title: 'Live: erros frequentes em BI-RADS',
    date: '2026-05-21',
    time: '19:30',
    type: 'Live',
    teacherId: 'guilherme-porto',
    coordinatorId: 'antonio-gadelha',
    guestNames: ['Prof. Dr. Antônio Gadelha'],
    lessonId: 'birads-mamaria',
    platform: 'Zoom',
    liveLink: 'https://zoom.us/j/82970503125?pwd=487450',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    accessMode: 'gratuita',
    description: 'Discussão ao vivo com casos reais anonimizados e perguntas da turma.',
  },
  {
    id: 'ev-3',
    title: 'Estudo de caso: endometriose retrocervical',
    date: '2026-05-23',
    type: 'Estudo de caso',
    teacherId: 'patricia-gadelha',
    description: 'Caso avançado com foco em descrição compartimental.',
  },
  {
    id: 'ev-4',
    title: 'Encontro presencial: mão na sonda',
    date: '2026-05-25',
    time: '08:00',
    endTime: '17:00',
    type: 'Encontro presencial',
    teacherId: 'antonio-gadelha',
    platform: 'Presencial',
    description: 'Sessão prática para alunos da turma presencial UNEZUS.',
  },
  {
    id: 'ev-5',
    title: 'Liberação: Doppler Obstétrico',
    date: '2026-05-29',
    type: 'Aula liberada',
    teacherId: 'patricia-gadelha',
    lessonId: 'doppler-obstetrico',
    description: 'Conteúdo novo com foco em vasos uterinos, umbilical e cerebral média.',
  },
  {
    id: 'ev-6',
    title: 'Prazo de certificado: Módulo Doppler',
    date: '2026-05-31',
    type: 'Prazo de certificado',
    description: 'Concluir as aulas do módulo para liberar o certificado digital.',
  },
  {
    id: 'ev-7',
    title: 'WEBINAR-US - Doppler de Carótidas',
    date: '2026-06-01',
    time: '19:30',
    type: 'Live',
    teacherId: 'antonio-gadelha',
    coordinatorId: 'antonio-gadelha',
    guestNames: ['Prof. Dr. Antônio Gadelha'],
    lessonId: 'doppler-carotidas',
    platform: 'Zoom',
    liveLink: 'https://us06web.zoom.us/j/89936526671?pwd=ueJESPzVKh5lFfwihaDUb50iNcEvs6.1',
    accessMode: 'gratuita',
    description: 'Webinar ao vivo sobre Doppler de carótidas, das indicações ao laudo ecográfico, com entrada imediata pelo link do Zoom.',
  },
]

export const students: Student[] = [
  {
    id: 'rafael-lima-aluno',
    name: 'Dr. Rafael Lima',
    email: 'rafael.lima@aluno.unezus.com.br',
    status: 'ativo',
    plan: 'Acesso vitalício',
    progress: 92,
    lastAccess: 'hoje, 08:42',
    points: 1240,
    completedLessons: 38,
    comments: 24,
    badges: ['Top 1', 'Doppler Pro', 'Mentor da comunidade'],
    interest: 'Doppler vascular',
  },
  {
    id: 'marina-costa-aluna',
    name: 'Dra. Marina Costa',
    email: 'marina.costa@aluno.unezus.com.br',
    status: 'ativo',
    plan: 'Assinatura mensal',
    progress: 78,
    lastAccess: 'ontem, 21:10',
    points: 980,
    completedLessons: 31,
    comments: 19,
    badges: ['Consistência', 'BI-RADS'],
    interest: 'Mama e partes moles',
  },
  {
    id: 'joao-mendes',
    name: 'Dr. João Mendes',
    email: 'joao.mendes@aluno.unezus.com.br',
    status: 'ativo',
    plan: 'Turma presencial',
    progress: 64,
    lastAccess: 'hoje, 14:18',
    points: 870,
    completedLessons: 24,
    comments: 16,
    badges: ['Aluno ativo', 'POCUS Start'],
    interest: 'Ginecologia e Doppler',
  },
  {
    id: 'ana-beatriz',
    name: 'Dra. Ana Beatriz Rocha',
    email: 'ana.rocha@aluno.unezus.com.br',
    status: 'ativo',
    plan: 'Aluno individual',
    progress: 58,
    lastAccess: '16/05/2026',
    points: 760,
    completedLessons: 21,
    comments: 10,
    badges: ['Obstetrícia'],
    interest: 'Medicina fetal',
  },
  {
    id: 'carlos-neves',
    name: 'Dr. Carlos Neves',
    email: 'carlos.neves@aluno.unezus.com.br',
    status: 'inativo',
    plan: 'Assinatura mensal',
    progress: 22,
    lastAccess: '02/05/2026',
    points: 320,
    completedLessons: 8,
    comments: 4,
    badges: ['Iniciante'],
    interest: 'Abdome',
  },
]

export const supportTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    subject: 'Material complementar não abre no tablet',
    category: 'Materiais',
    status: 'respondido',
    date: '14/05/2026',
    message: 'A equipe reenviou o link do PDF e orientou atualização do navegador.',
  },
  {
    id: 'ticket-2',
    subject: 'Dúvida sobre emissão de certificado',
    category: 'Certificados',
    status: 'em análise',
    date: '18/05/2026',
    message: 'Validação de conclusão do módulo Doppler em andamento.',
  },
]

export const lessonComments: LessonComment[] = [
  {
    id: 'comment-1',
    lessonId: 'birads-mamaria',
    author: 'Dra. Ana Beatriz Rocha',
    role: 'aluno',
    status: 'respondido',
    date: 'há 2 dias',
    message:
      'Professor, quando um nódulo é oval e paralelo, mas tem margem microlobulada, o senhor costuma subir para BI-RADS 4A?',
  },
  {
    id: 'comment-2',
    lessonId: 'birads-mamaria',
    author: 'Dr. Guilherme Porto',
    role: 'professor',
    status: 'respondido',
    date: 'há 1 dia',
    message:
      'Sim. A margem deixa de ser circunscrita e passa a carregar mais peso do que a orientação paralela. Na prática, eu descrevo o achado e recomendo correlação histológica quando o conjunto sustenta 4A.',
  },
  {
    id: 'comment-3',
    lessonId: 'birads-mamaria',
    author: 'Dr. João Mendes',
    role: 'aluno',
    status: 'pendente',
    date: 'há 8 horas',
    message: 'Gostei do paralelo com o laudo. Ajuda muito a não escrever descritores contraditórios.',
  },
  {
    id: 'comment-4',
    lessonId: 'endometriose-profunda',
    author: 'Dra. Ana Beatriz Rocha',
    role: 'aluno',
    status: 'pendente',
    date: 'há 3 horas',
    message:
      'Na suspeita de lesão em torus uterino, vocês recomendam sempre preparo intestinal para melhorar a avaliação?',
  },
  {
    id: 'comment-5',
    lessonId: 'doppler-fundamentos',
    author: 'Dr. Carlos Neves',
    role: 'aluno',
    status: 'respondido',
    date: 'há 4 dias',
    message: 'O ajuste do PRF ficou muito claro. Minha dúvida é quando priorizar reduzir escala versus ajustar ganho.',
  },
]

export const certificates: Certificate[] = [
  {
    id: 'cert-doppler',
    title: 'Doppler Essencial e Aplicado',
    module: 'Trilha Doppler',
    specialtySlug: 'doppler',
    teacherId: 'antonio-gadelha',
    status: 'em andamento',
    progress: 74,
    hours: '16 horas',
    certificateCode: 'UNE-DOP-2026-0741',
    summary: 'Liberação automática ao concluir aulas-chave, materiais práticos e checklist final do módulo.',
  },
  {
    id: 'cert-birads',
    title: 'BI-RADS Aplicado à Prática',
    module: 'Imagem Mamária',
    specialtySlug: 'mama',
    teacherId: 'guilherme-porto',
    status: 'disponível',
    progress: 100,
    hours: '8 horas',
    issueDate: '2026-05-18',
    certificateCode: 'UNE-MAM-2026-1884',
    summary: 'Módulo concluído com emissão imediata para download e validação interna da turma.',
  },
  {
    id: 'cert-pocus',
    title: 'POCUS no Atendimento Inicial',
    module: 'POCUS e Emergência',
    specialtySlug: 'pocus',
    teacherId: 'armando-mendes',
    status: 'em andamento',
    progress: 40,
    hours: '10 horas',
    certificateCode: 'UNE-POC-2026-0412',
    summary: 'Emissão prevista após conclusão do módulo, estudo de caso final e quiz de fixação.',
  },
]

export const adminAiActions = [
  'Gerar resumo da aula',
  'Sugerir título mais vendável',
  'Criar quiz de fixação',
  'Criar descrição para vitrine',
  'Recomendar próximas aulas por perfil de aluno',
]
