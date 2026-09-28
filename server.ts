import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db, pool, schema } from './src/db/index.ts';

dotenv.config();

const dataTables = {
  communes: schema.communes,
  users: schema.users,
  units: schema.units,
  clans: schema.clans,
  households: schema.households,
  periods: schema.periods,
  progress: schema.progress,
  scores: schema.scores,
  criteria: schema.criteria,
  bonusCategories: schema.bonusCategories,
  penaltyCategories: schema.penaltyCategories,
  titleCategories: schema.titleCategories,
  householdTypes: schema.householdTypes,
} as const;

type DataTableName = keyof typeof dataTables;

const tableNames = new Set(Object.keys(dataTables));

async function ensureDatabaseSchema() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS communes (
      id text PRIMARY KEY,
      name text NOT NULL,
      code text NOT NULL,
      commune_type text NOT NULL,
      region_type text DEFAULT 'dong_bang',
      district text,
      province text,
      phone text,
      email text,
      leader_name text,
      notes text,
      active_period_id text,
      created_at timestamp DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      username text NOT NULL,
      full_name text NOT NULL,
      role text NOT NULL,
      commune_id text,
      commune_name text,
      unit_id text,
      unit_name text,
      phone text,
      email text
    );

    CREATE TABLE IF NOT EXISTS units (
      id text PRIMARY KEY,
      commune_id text NOT NULL,
      commune_name text,
      name text NOT NULL,
      code text NOT NULL,
      leader_name text,
      leader_phone text,
      total_households integer,
      total_population integer,
      address text,
      notes text,
      report_files jsonb
    );

    CREATE TABLE IF NOT EXISTS clans (
      id text PRIMARY KEY,
      commune_id text NOT NULL,
      commune_name text,
      code text,
      name text NOT NULL,
      unit_id text,
      unit_name text,
      patriarch_name text,
      patriarch_phone text,
      total_households integer,
      chief_name text,
      phone text,
      address text,
      member_count integer,
      cultural_status text,
      recognition_year integer,
      decision_number text,
      decision_date text,
      achievements text,
      commune_notes text
    );

    CREATE TABLE IF NOT EXISTS households (
      id text PRIMARY KEY,
      commune_id text NOT NULL,
      commune_name text,
      unit_id text NOT NULL,
      unit_name text,
      clan_id text,
      clan_name text,
      code text NOT NULL,
      head_name text NOT NULL,
      gender text,
      birth_year integer,
      member_count integer,
      address text,
      residential_cluster text,
      is_party_member_family boolean,
      party_member_count integer,
      phone text,
      notes text,
      is_exemplary boolean
    );

    CREATE TABLE IF NOT EXISTS periods (
      id text PRIMARY KEY,
      commune_id text NOT NULL,
      commune_name text,
      name text NOT NULL,
      year integer NOT NULL,
      start_date text,
      end_date text,
      status text,
      notes text,
      is_locked boolean,
      is_published boolean,
      decision_number text,
      decision_date text,
      decision_signer text,
      decision_file jsonb,
      report_files jsonb,
      is_finalized boolean
    );

    CREATE TABLE IF NOT EXISTS progress (
      id text PRIMARY KEY,
      unit_id text NOT NULL,
      period_id text NOT NULL,
      status text NOT NULL,
      submitted_at text,
      submitted_by text,
      approved_at text,
      approved_by text,
      returned_at text,
      returned_by text,
      return_reason text,
      report_files jsonb,
      notes text
    );

    CREATE TABLE IF NOT EXISTS scores (
      id text PRIMARY KEY,
      period_id text NOT NULL,
      target_type text NOT NULL,
      target_id text NOT NULL,
      target_name text NOT NULL,
      unit_id text NOT NULL,
      unit_name text NOT NULL,
      criteria_scores jsonb,
      item_scores jsonb,
      bonus_points real,
      penalty_points real,
      comments text,
      total_standard_score real,
      final_score real,
      is_qualified boolean,
      is_exemplary boolean,
      has_violation boolean,
      violation_details text,
      evidence_files jsonb,
      return_status text,
      revised_at text,
      return_reason text,
      evaluated_by_level text,
      updated_at text
    );

    CREATE TABLE IF NOT EXISTS criteria (
      id text PRIMARY KEY,
      standard_key text NOT NULL,
      code text NOT NULL,
      name text NOT NULL,
      max_points integer NOT NULL,
      target_type text NOT NULL,
      description text,
      order_index integer,
      region_type text
    );

    CREATE TABLE IF NOT EXISTS bonus_categories (
      id text PRIMARY KEY,
      code text NOT NULL,
      title text NOT NULL,
      points real NOT NULL,
      applicable_target text NOT NULL,
      category_group text,
      description text,
      region_type text
    );

    CREATE TABLE IF NOT EXISTS penalty_categories (
      id text PRIMARY KEY,
      code text NOT NULL,
      title text NOT NULL,
      points real NOT NULL,
      applicable_target text NOT NULL,
      category_group text,
      severity text,
      description text,
      region_type text
    );

    CREATE TABLE IF NOT EXISTS title_categories (
      id text PRIMARY KEY,
      code text NOT NULL,
      name text NOT NULL,
      target_type text NOT NULL,
      min_score real NOT NULL,
      quota_percent real,
      is_exemplary boolean NOT NULL,
      legal_doc text,
      description text
    );

    CREATE TABLE IF NOT EXISTS household_types (
      id text PRIMARY KEY,
      code text NOT NULL,
      name text NOT NULL,
      description text,
      color text
    );
  `);

  const addColumns: Record<string, string[]> = {
    communes: [
      `ADD COLUMN IF NOT EXISTS region_type text DEFAULT 'dong_bang'`,
      `ADD COLUMN IF NOT EXISTS district text`,
      `ADD COLUMN IF NOT EXISTS province text`,
      `ADD COLUMN IF NOT EXISTS phone text`,
      `ADD COLUMN IF NOT EXISTS email text`,
      `ADD COLUMN IF NOT EXISTS leader_name text`,
      `ADD COLUMN IF NOT EXISTS notes text`,
    ],
    units: [
      `ADD COLUMN IF NOT EXISTS commune_name text`,
      `ADD COLUMN IF NOT EXISTS total_households integer`,
      `ADD COLUMN IF NOT EXISTS total_population integer`,
      `ADD COLUMN IF NOT EXISTS notes text`,
      `ADD COLUMN IF NOT EXISTS report_files jsonb`,
    ],
    clans: [
      `ADD COLUMN IF NOT EXISTS commune_name text`,
      `ADD COLUMN IF NOT EXISTS code text`,
      `ADD COLUMN IF NOT EXISTS unit_id text`,
      `ADD COLUMN IF NOT EXISTS unit_name text`,
      `ADD COLUMN IF NOT EXISTS patriarch_name text`,
      `ADD COLUMN IF NOT EXISTS patriarch_phone text`,
      `ADD COLUMN IF NOT EXISTS total_households integer`,
    ],
    households: [
      `ADD COLUMN IF NOT EXISTS commune_name text`,
      `ADD COLUMN IF NOT EXISTS unit_name text`,
      `ADD COLUMN IF NOT EXISTS clan_name text`,
      `ADD COLUMN IF NOT EXISTS gender text`,
      `ADD COLUMN IF NOT EXISTS birth_year integer`,
      `ADD COLUMN IF NOT EXISTS residential_cluster text`,
      `ADD COLUMN IF NOT EXISTS phone text`,
    ],
    periods: [
      `ADD COLUMN IF NOT EXISTS commune_name text`,
      `ADD COLUMN IF NOT EXISTS status text`,
      `ADD COLUMN IF NOT EXISTS notes text`,
      `ADD COLUMN IF NOT EXISTS is_finalized boolean`,
    ],
    scores: [
      `ADD COLUMN IF NOT EXISTS item_scores jsonb`,
      `ADD COLUMN IF NOT EXISTS revised_at text`,
      `ADD COLUMN IF NOT EXISTS updated_at text`,
    ],
  };

  for (const [tableName, columns] of Object.entries(addColumns)) {
    for (const columnSql of columns) {
      await pool.query(`ALTER TABLE ${tableName} ${columnSql}`);
    }
  }
}

function normalizeRows(tableName: DataTableName, rows: unknown[]) {
  if (tableName === 'communes') {
    return rows.map((row: any) => {
      const { createdAt, ...commune } = row;
      return {
        ...commune,
        communeType:
          commune.communeType === 'xa'
            ? '1'
            : commune.communeType === 'phuong'
              ? '2'
              : commune.communeType === 'thi_tran'
                ? '3'
                : commune.communeType,
      };
    });
  }

  if (tableName === 'progress') {
    return rows.map((row: any) => ({
      ...row,
      id: row.id || `${row.unitId || row.unit_id}-${row.periodId || row.period_id}`,
    }));
  }
  return rows;
}

async function startServer() {
  await ensureDatabaseSchema();

  const app = express();
  app.use(express.json());

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', postgresConnected: !!db });
  });

  app.get('/api/data', async (req, res) => {
    try {
      if (!db) {
        return res.status(503).json({ error: 'Database is not configured' });
      }

      const result: Record<string, unknown[]> = {};
      for (const [name, table] of Object.entries(dataTables)) {
        result[name] = await db.select().from(table);
      }
      return res.json(result);
    } catch (error) {
      console.error('Error fetching application data from DB:', error);
      res.status(500).json({ error: 'Failed to fetch application data' });
    }
  });

  app.put('/api/data/:table', async (req, res) => {
    try {
      const tableName = req.params.table as DataTableName;
      if (!db || !tableNames.has(tableName)) {
        return res.status(404).json({ error: 'Unknown data table' });
      }

      const rows = Array.isArray(req.body) ? normalizeRows(tableName, req.body) : [];
      const table = dataTables[tableName];
      await db.delete(table);
      if (rows.length > 0) {
        await db.insert(table).values(rows as any[]);
      }

      res.json({ success: true, count: rows.length });
    } catch (error) {
      console.error(`Error replacing table ${req.params.table}:`, error);
      res.status(500).json({ error: 'Failed to save application data' });
    }
  });

  // Example API endpoint for communes
  app.get('/api/communes', async (req, res) => {
    try {
      if (db) {
        const result = await db.select().from(schema.communes);
        return res.json(result);
      }
      res.json([]);
    } catch (error) {
      console.error('Error fetching communes from DB:', error);
      res.status(500).json({ error: 'Failed to fetch communes' });
    }
  });

  // Vite middleware for frontend development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const port = process.env.PORT || 3000;
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
