import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { sql } from 'drizzle-orm';
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
const authCookieName = 'gdvh_session';
const hashSessionToken = (token: string) => createHash('sha256').update(token).digest('hex');
const legacyPasswords: Record<string, string> = {
  admin: 'admin123',
  xa: 'xa123',
  to1: 'to123',
  to2: 'to2123',
};

const isLegacyPasswordValid = (username: string, password: string) =>
  password === '123456' || legacyPasswords[username.toLowerCase()] === password;

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

const verifyPassword = (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const getAuthSessionToken = (cookieHeader = '') => {
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${authCookieName}=`));
  return cookie?.slice(authCookieName.length + 1) || '';
};

const authCookieOptions = process.env.NODE_ENV === 'production' ? '; Secure' : '';

async function syncUnitCountsFromHouseholds(transaction?: any) {
  const query = `
    UPDATE units AS unit
    SET
      total_households = counts.household_count,
      total_population = counts.population_count
    FROM (
      SELECT
        unit_row.id,
        COUNT(household.id)::integer AS household_count,
        COALESCE(SUM(COALESCE(household.member_count, 0)), 0)::integer AS population_count
      FROM units AS unit_row
      LEFT JOIN households AS household ON household.unit_id = unit_row.id
      GROUP BY unit_row.id
    ) AS counts
    WHERE unit.id = counts.id
  `;
  if (transaction) {
    await transaction.execute(sql.raw(query));
  } else if (pool) {
    await pool.query(query);
  }
}

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

    CREATE TABLE IF NOT EXISTS user_credentials (
      user_id text PRIMARY KEY,
      password_hash text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash text PRIMARY KEY,
      user_id text NOT NULL,
      expires_at timestamptz NOT NULL
    );

    CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions (expires_at);

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

  await syncUnitCountsFromHouseholds();
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
  app.use(express.json({ limit: '50mb' }));

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', postgresConnected: !!db });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      if (!db || !pool) return res.status(503).json({ success: false, message: 'Cơ sở dữ liệu chưa sẵn sàng.' });

      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');
      const [user] = await db
        .select()
        .from(schema.users)
        .where(sql`lower(${schema.users.username}) = lower(${username})`)
        .limit(1);

      if (!user) return res.status(401).json({ success: false, message: 'Tên đăng nhập không tồn tại!' });

      const credential = await pool.query('SELECT password_hash FROM user_credentials WHERE user_id = $1', [user.id]);
      const valid = credential.rows.length > 0
        ? verifyPassword(password, credential.rows[0].password_hash)
        : isLegacyPasswordValid(user.username, password);

      if (!valid) return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
      const sessionToken = randomBytes(32).toString('hex');
      await pool.query(
        'INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
        [hashSessionToken(sessionToken), user.id, new Date(Date.now() + 8 * 60 * 60 * 1000)]
      );
      res.setHeader(
        'Set-Cookie',
        `${authCookieName}=${sessionToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${authCookieOptions}`
      );
      return res.json({ success: true, user });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ success: false, message: 'Không thể xác thực tài khoản lúc này.' });
    }
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      if (!db || !pool) return res.status(503).json({ success: false });
      const sessionToken = getAuthSessionToken(req.headers.cookie);
      if (!sessionToken) return res.status(401).json({ success: false });

      const session = await pool.query(
        'SELECT user_id FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()',
        [hashSessionToken(sessionToken)]
      );
      if (!session.rows[0]) return res.status(401).json({ success: false });

      const [user] = await db.select().from(schema.users).where(sql`${schema.users.id} = ${session.rows[0].user_id}`).limit(1);
      if (!user) {
        await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [hashSessionToken(sessionToken)]);
        return res.status(401).json({ success: false });
      }
      return res.json({ success: true, user });
    } catch (error) {
      console.error('Error restoring auth session:', error);
      return res.status(500).json({ success: false });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const sessionToken = getAuthSessionToken(req.headers.cookie);
    if (sessionToken && pool) {
      try {
        await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [hashSessionToken(sessionToken)]);
      } catch (error) {
        console.error('Error revoking auth session:', error);
      }
    }
    res.setHeader('Set-Cookie', `${authCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${authCookieOptions}`);
    return res.json({ success: true });
  });

  app.post('/api/auth/change-password', async (req, res) => {
    try {
      if (!db || !pool) return res.status(503).json({ success: false, message: 'Cơ sở dữ liệu chưa sẵn sàng.' });

      const userId = String(req.body?.userId || '');
      const currentPassword = String(req.body?.currentPassword || '');
      const newPassword = String(req.body?.newPassword || '');
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      }

      const [user] = await db.select().from(schema.users).where(sql`${schema.users.id} = ${userId}`).limit(1);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });

      const credential = await pool.query('SELECT password_hash FROM user_credentials WHERE user_id = $1', [user.id]);
      const valid = credential.rows.length > 0
        ? verifyPassword(currentPassword, credential.rows[0].password_hash)
        : isLegacyPasswordValid(user.username, currentPassword);
      if (!valid) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });

      await pool.query(
        `INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [user.id, hashPassword(newPassword)]
      );
      return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ success: false, message: 'Không thể lưu mật khẩu mới lúc này.' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      if (!db || !pool) return res.status(503).json({ success: false, message: 'Cơ sở dữ liệu chưa sẵn sàng.' });

      const targetUserId = String(req.body?.targetUserId || '');
      const actorUserId = getAuthSessionUserId(req.headers.cookie);
      if (!actorUserId) {
        return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
      }
      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Thiếu tài khoản cần đặt lại mật khẩu.' });
      }

      const [actor] = await db.select().from(schema.users).where(sql`${schema.users.id} = ${actorUserId}`).limit(1);
      const [target] = await db.select().from(schema.users).where(sql`${schema.users.id} = ${targetUserId}`).limit(1);
      if (!actor || !target) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });

      const mayReset = actor.id !== target.id && (
        (actor.role === 'admin' && target.role !== 'admin') ||
        (actor.role === 'can_bo_xa' && target.role === 'to_truong' && !!actor.communeId && actor.communeId === target.communeId)
      );
      if (!mayReset) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền đặt lại mật khẩu tài khoản này.' });
      }

      await pool.query(
        `INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [target.id, hashPassword('123456')]
      );
      return res.json({ success: true, message: `Đã đặt lại mật khẩu ${target.username} về 123456.` });
    } catch (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ success: false, message: 'Không thể đặt lại mật khẩu lúc này.' });
    }
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
      // Xoá + ghi lại trong cùng transaction để không mất dữ liệu khi insert lỗi
      await db.transaction(async (tx) => {
        await tx.delete(table);
        if (rows.length > 0) {
          // Postgres chỉ nhận tối đa 65535 tham số bind cho mỗi câu lệnh
          const columnCount = Math.max(1, Object.keys(rows[0] as object).length);
          const chunkSize = Math.max(1, Math.floor(65000 / columnCount));
          for (let i = 0; i < rows.length; i += chunkSize) {
            await tx.insert(table).values(rows.slice(i, i + chunkSize) as any[]);
          }
        }
      if (tableName === 'units' || tableName === 'households') {
            await syncUnitCountsFromHouseholds(tx);
      }
        });

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
