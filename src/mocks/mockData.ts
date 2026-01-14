import type {
  Product,
  Taxonomy,
  Persona,
  Feature,
  Dimension,
  Entity,
  Relationship,
  Settings,
} from '@/lib/types';

// ============================================
// Mock Product
// ============================================

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'SidelineHD',
    description: 'Live streaming platform for youth sports',
    icon: null,
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2025-01-14T09:00:00Z',
    lastActivityAt: '2025-01-14T09:00:00Z',
  },
];

// ============================================
// Mock Taxonomy
// ============================================

const MOCK_PERSONAS: Persona[] = [
  { id: 'persona_1', productId: 'prod_1', name: 'Livestreamer', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'persona_2', productId: 'prod_1', name: 'Coach', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'persona_3', productId: 'prod_1', name: 'Player Manager', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'persona_4', productId: 'prod_1', name: 'Admin', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
];

const MOCK_FEATURES: Feature[] = [
  { id: 'feat_1', productId: 'prod_1', name: 'Streaming Quality', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'feat_2', productId: 'prod_1', name: 'Scoring', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'feat_3', productId: 'prod_1', name: 'Monetization', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
  { id: 'feat_4', productId: 'prod_1', name: 'Notifications', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
];

const MOCK_DIMENSIONS: Dimension[] = [
  {
    id: 'dim_sport',
    productId: 'prod_1',
    name: 'Sport',
    isArchived: false,
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
    values: [
      { id: 'sport_1', dimensionId: 'dim_sport', name: 'Baseball', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
      { id: 'sport_2', dimensionId: 'dim_sport', name: 'Volleyball', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
      { id: 'sport_3', dimensionId: 'dim_sport', name: 'Hockey', isArchived: false, createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-06-15T10:00:00Z' },
    ],
  },
];

export const MOCK_TAXONOMY: Taxonomy = {
  personas: MOCK_PERSONAS,
  features: MOCK_FEATURES,
  dimensions: MOCK_DIMENSIONS,
};

// ============================================
// Mock Entities
// ============================================

// Inbox items (captures, feedback, feature requests)
export const MOCK_INBOX_ITEMS: Entity[] = [
  {
    id: 'cap_1',
    productId: 'prod_1',
    type: 'capture',
    title: '',
    body: 'Users are complaining about stream lag during peak hours',
    status: null,
    metadata: null,
    promotedToId: null,
    createdAt: '2025-01-14T07:00:00Z',
    updatedAt: '2025-01-14T07:00:00Z',
    personaIds: ['persona_1'],
    featureIds: ['feat_1'],
    dimensionValueIds: [],
  },
  {
    id: 'fb_1',
    productId: 'prod_1',
    type: 'feedback',
    title: 'Coach feedback on scoring',
    body: 'The scoring interface is confusing during fast-paced games',
    status: 'new',
    metadata: { feedbackType: 'complaint', source: 'Coach Martinez - Beta call' },
    promotedToId: null,
    createdAt: '2025-01-13T14:00:00Z',
    updatedAt: '2025-01-13T14:00:00Z',
    personaIds: ['persona_2'],
    featureIds: ['feat_2'],
    dimensionValueIds: ['sport_1'],
  },
  {
    id: 'req_1',
    productId: 'prod_1',
    type: 'feature_request',
    title: 'Export game stats to PDF',
    body: 'Multiple coaches have asked for the ability to export game statistics as a PDF for team meetings',
    status: 'considering',
    metadata: { priority: 'medium', source: 'Support tickets (5 requests)' },
    promotedToId: null,
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
    personaIds: ['persona_2', 'persona_3'],
    featureIds: [],
    dimensionValueIds: [],
  },
];

// Problems
export const MOCK_PROBLEMS: Entity[] = [
  {
    id: 'prob_1',
    productId: 'prod_1',
    type: 'problem',
    title: 'Stream quality degrades during peak hours',
    body: 'Users report buffering and quality drops between 6-9pm when most games are happening.',
    status: 'active',
    metadata: null,
    promotedToId: null,
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-13T11:00:00Z',
    personaIds: ['persona_1'],
    featureIds: ['feat_1'],
    dimensionValueIds: [],
  },
];

// Hypotheses
export const MOCK_HYPOTHESES: Entity[] = [
  {
    id: 'hyp_1',
    productId: 'prod_1',
    type: 'hypothesis',
    title: 'Adaptive bitrate will reduce buffering complaints by 50%',
    body: 'If we implement adaptive bitrate streaming, then users will experience fewer buffering events because the stream will adjust to their connection quality.',
    status: 'active',
    metadata: { confidence: 0.7 },
    promotedToId: null,
    createdAt: '2025-01-11T10:00:00Z',
    updatedAt: '2025-01-12T14:00:00Z',
    personaIds: ['persona_1'],
    featureIds: ['feat_1'],
    dimensionValueIds: [],
  },
];

// Experiments
export const MOCK_EXPERIMENTS: Entity[] = [
  {
    id: 'exp_1',
    productId: 'prod_1',
    type: 'experiment',
    title: 'Adaptive bitrate A/B test',
    body: 'Testing adaptive bitrate with 10% of users to measure buffering reduction.',
    status: 'running',
    metadata: {
      outcome: undefined,
      metrics: ['Buffering events per stream', 'User complaints', 'Average watch time'],
      startDate: '2025-01-12T00:00:00Z',
      endDate: undefined,
    },
    promotedToId: null,
    createdAt: '2025-01-12T08:00:00Z',
    updatedAt: '2025-01-14T08:00:00Z',
    personaIds: ['persona_1'],
    featureIds: ['feat_1'],
    dimensionValueIds: [],
  },
];

// Decisions
export const MOCK_DECISIONS: Entity[] = [
  {
    id: 'dec_1',
    productId: 'prod_1',
    type: 'decision',
    title: 'Prioritize streaming quality over new features in Q1',
    body: 'We decided to focus engineering efforts on streaming reliability rather than new feature development for Q1 2025.',
    status: null,
    metadata: { decisionType: 'reversible', decidedAt: '2025-01-08T15:00:00Z' },
    promotedToId: null,
    createdAt: '2025-01-08T15:00:00Z',
    updatedAt: '2025-01-08T15:00:00Z',
    personaIds: [],
    featureIds: ['feat_1'],
    dimensionValueIds: [],
  },
];

// Features (shipped)
export const MOCK_FEATURES_ENTITIES: Entity[] = [
  {
    id: 'feature_1',
    productId: 'prod_1',
    type: 'feature',
    title: 'Live score overlay',
    body: 'Real-time score display overlaid on the stream.',
    status: 'shipped',
    metadata: {
      health: 'healthy',
      shippedAt: '2024-09-15T00:00:00Z',
      checkIns: [
        { id: 'ci_1', date: '2025-01-01T00:00:00Z', health: 'healthy', notes: 'No issues reported' },
      ],
    },
    promotedToId: null,
    createdAt: '2024-09-15T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    personaIds: ['persona_1', 'persona_2'],
    featureIds: ['feat_2'],
    dimensionValueIds: [],
  },
];

// Artifacts
export const MOCK_ARTIFACTS: Entity[] = [
  {
    id: 'art_1',
    productId: 'prod_1',
    type: 'artifact',
    title: 'Buffering complaints screenshot',
    body: 'Screenshot of support tickets showing buffering complaints pattern.',
    status: 'final',
    metadata: { artifactType: 'image', source: 'Zendesk' },
    promotedToId: null,
    createdAt: '2025-01-10T09:30:00Z',
    updatedAt: '2025-01-10T09:30:00Z',
    personaIds: [],
    featureIds: ['feat_1'],
    dimensionValueIds: [],
  },
];

// Combine all entities
export const MOCK_ALL_ENTITIES: Entity[] = [
  ...MOCK_INBOX_ITEMS,
  ...MOCK_PROBLEMS,
  ...MOCK_HYPOTHESES,
  ...MOCK_EXPERIMENTS,
  ...MOCK_DECISIONS,
  ...MOCK_FEATURES_ENTITIES,
  ...MOCK_ARTIFACTS,
];

// ============================================
// Mock Relationships
// ============================================

export const MOCK_RELATIONSHIPS: Relationship[] = [
  {
    id: 'rel_1',
    productId: 'prod_1',
    sourceId: 'hyp_1',
    targetId: 'prob_1',
    relationshipType: 'supports',
    createdAt: '2025-01-11T10:00:00Z',
    updatedAt: '2025-01-11T10:00:00Z',
  },
  {
    id: 'rel_2',
    productId: 'prod_1',
    sourceId: 'exp_1',
    targetId: 'hyp_1',
    relationshipType: 'tests',
    createdAt: '2025-01-12T08:00:00Z',
    updatedAt: '2025-01-12T08:00:00Z',
  },
  {
    id: 'rel_3',
    productId: 'prod_1',
    sourceId: 'art_1',
    targetId: 'prob_1',
    relationshipType: 'evidence',
    createdAt: '2025-01-10T09:30:00Z',
    updatedAt: '2025-01-10T09:30:00Z',
  },
];

// ============================================
// Mock Settings
// ============================================

export const MOCK_SETTINGS: Settings = {
  id: 1,
  workspacePath: '/mock/workspace',
  lastProductId: 'prod_1',
  restoreLastContext: true,
  defaultExportMode: 'full',
  defaultIncrementalRange: 'last_7_days',
  includeLinkedContext: true,
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2025-01-14T09:00:00Z',
};
