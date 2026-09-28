import { pgTable, text, timestamp, integer, boolean, jsonb, real } from 'drizzle-orm/pg-core';

export const communes = pgTable('communes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  communeType: text('commune_type').notNull(), // 'xa' | 'phuong' | 'tt'
  regionType: text('region_type').default('dong_bang'), // 'dong_bang' | 'mien_nui'
  activePeriodId: text('active_period_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const units = pgTable('units', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  leaderName: text('leader_name'),
  leaderPhone: text('leader_phone'),
  address: text('address'),
});

export const clans = pgTable('clans', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  name: text('name').notNull(),
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
  unitId: text('unit_id').notNull(),
  clanId: text('clan_id'),
  code: text('code').notNull(),
  headName: text('head_name').notNull(),
  memberCount: integer('member_count'),
  address: text('address'),
  isPartyMemberFamily: boolean('is_party_member_family'),
  partyMemberCount: integer('party_member_count'),
  notes: text('notes'),
  isExemplary: boolean('is_exemplary'),
});

export const periods = pgTable('periods', {
  id: text('id').primaryKey(),
  communeId: text('commune_id').notNull(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isLocked: boolean('is_locked'),
  isPublished: boolean('is_published'),
  decisionNumber: text('decision_number'),
  decisionDate: text('decision_date'),
  decisionSigner: text('decision_signer'),
  decisionFile: jsonb('decision_file'),
  reportFiles: jsonb('report_files'),
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
  returnReason: text('return_reason'),
  evaluatedByLevel: text('evaluated_by_level'),
});
