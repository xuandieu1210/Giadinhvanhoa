import { pgTable, text, timestamp, integer, boolean, jsonb, real } from 'drizzle-orm/pg-core';

export const communes = pgTable('communes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  communeType: text('commune_type').notNull(), // 'xa' | 'phuong' | 'tt'
  regionType: text('region_type').default('dong_bang'), // 'dong_bang' | 'mien_nui'
  district: text('district'),
  province: text('province'),
  phone: text('phone'),
  email: text('email'),
  leaderName: text('leader_name'),
  notes: text('notes'),
  activePeriodId: text('active_period_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(),
  communeId: text('commune_id'),
  communeName: text('commune_name'),
  unitId: text('unit_id'),
  unitName: text('unit_name'),
  phone: text('phone'),
  email: text('email'),
});

export const units = pgTable('units', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  communeName: text('commune_name'),
  name: text('name').notNull(),
  code: text('code').notNull(),
  leaderName: text('leader_name'),
  leaderPhone: text('leader_phone'),
  totalHouseholds: integer('total_households'),
  totalPopulation: integer('total_population'),
  address: text('address'),
  notes: text('notes'),
  reportFiles: jsonb('report_files'),
});

export const clans = pgTable('clans', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  communeName: text('commune_name'),
  code: text('code'),
  name: text('name').notNull(),
  unitId: text('unit_id'),
  unitName: text('unit_name'),
  patriarchName: text('patriarch_name'),
  patriarchPhone: text('patriarch_phone'),
  totalHouseholds: integer('total_households'),
  chiefName: text('chief_name'),
  phone: text('phone'),
  address: text('address'),
  memberCount: integer('member_count'),
  culturalStatus: text('cultural_status'),
  recognitionYear: integer('recognition_year'),
  decisionNumber: text('decision_number'),
  decisionDate: text('decision_date'),
  achievements: text('achievements'),
  communeNotes: text('commune_notes'),
});

export const households = pgTable('households', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  communeName: text('commune_name'),
  unitId: text('unit_id').notNull(),
  unitName: text('unit_name'),
  clanId: text('clan_id'),
  clanName: text('clan_name'),
  code: text('code').notNull(),
  headName: text('head_name').notNull(),
  gender: text('gender'),
  birthYear: integer('birth_year'),
  memberCount: integer('member_count'),
  address: text('address'),
  residentialCluster: text('residential_cluster'),
  isPartyMemberFamily: boolean('is_party_member_family'),
  partyMemberCount: integer('party_member_count'),
  phone: text('phone'),
  notes: text('notes'),
  isExemplary: boolean('is_exemplary'),
});

export const periods = pgTable('periods', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  communeName: text('commune_name'),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  status: text('status'),
  notes: text('notes'),
  isLocked: boolean('is_locked'),
  isPublished: boolean('is_published'),
  decisionNumber: text('decision_number'),
  decisionDate: text('decision_date'),
  decisionSigner: text('decision_signer'),
  decisionFile: jsonb('decision_file'),
  reportFiles: jsonb('report_files'),
  isFinalized: boolean('is_finalized'),
});

export const progress = pgTable('progress', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull(),
  periodId: text('period_id').notNull(),
  status: text('status').notNull(),
  submittedAt: text('submitted_at'),
  submittedBy: text('submitted_by'),
  approvedAt: text('approved_at'),
  approvedBy: text('approved_by'),
  returnedAt: text('returned_at'),
  returnedBy: text('returned_by'),
  returnReason: text('return_reason'),
  reportFiles: jsonb('report_files'),
  notes: text('notes'),
});

export const scores = pgTable('scores', {
  id: text('id').primaryKey(),
  periodId: text('period_id').notNull(),
  targetType: text('target_type').notNull(), // 'household' | 'unit' | 'clan'
  targetId: text('target_id').notNull(),
  targetName: text('target_name').notNull(),
  unitId: text('unit_id').notNull(),
  unitName: text('unit_name').notNull(),
  criteriaScores: jsonb('criteria_scores'),
  itemScores: jsonb('item_scores'),
  bonusPoints: real('bonus_points'),
  penaltyPoints: real('penalty_points'),
  comments: text('comments'),
  totalStandardScore: real('total_standard_score'),
  finalScore: real('final_score'),
  isQualified: boolean('is_qualified'),
  isExemplary: boolean('is_exemplary'),
  hasViolation: boolean('has_violation'),
  violationDetails: text('violation_details'),
  evidenceFiles: jsonb('evidence_files'),
  returnStatus: text('return_status'),
  revisedAt: text('revised_at'),
  returnReason: text('return_reason'),
  evaluatedByLevel: text('evaluated_by_level'),
  updatedAt: text('updated_at'),
});

// Danh mục tiêu chí bình xét Gia đình văn hóa (đồng bằng & miền núi)
export const criteria = pgTable('criteria', {
  id: text('id').primaryKey(),
  standardKey: text('standard_key').notNull(), // 'standard1' | 'standard2' | 'standard3' | 'standard4'
  code: text('code').notNull(),
  name: text('name').notNull(),
  maxPoints: integer('max_points').notNull(),
  targetType: text('target_type').notNull(), // 'all' | 'household' | 'unit' | 'clan'
  description: text('description'),
  order: integer('order_index'),
  regionType: text('region_type'), // 'dong_bang' | 'mien_nui' | null (áp dụng chung)
});

export const bonusCategories = pgTable('bonus_categories', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  points: real('points').notNull(),
  applicableTarget: text('applicable_target').notNull(),
  categoryGroup: text('category_group'),
  description: text('description'),
  regionType: text('region_type'),
});

export const penaltyCategories = pgTable('penalty_categories', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  points: real('points').notNull(),
  applicableTarget: text('applicable_target').notNull(),
  categoryGroup: text('category_group'),
  severity: text('severity'),
  description: text('description'),
  regionType: text('region_type'),
});

export const titleCategories = pgTable('title_categories', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  targetType: text('target_type').notNull(),
  minScore: real('min_score').notNull(),
  quotaPercent: real('quota_percent'),
  isExemplary: boolean('is_exemplary').notNull(),
  legalDoc: text('legal_doc'),
  description: text('description'),
});

export const householdTypes = pgTable('household_types', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
});
