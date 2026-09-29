import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAdministrativeTerms, AdministrativeTerms } from '../utils/administrativeTerms';
import {
  BonusCategory,
  Clan,
  ClanCulturalStatus,
  Commune,
  CriteriaScoreMap,
  CriterionItem,
  EvaluationPeriod,
  EvaluationScoreItem,
  EvidenceFile,
  Household,
  HouseholdTypeCategory,
  PenaltyCategory,
  StandardKey,
  TitleCategory,
  Unit,
  UnitPeriodProgress,
  UnitSubmissionStatus,
  User,
} from '../types';

type DataTableName =
  | 'communes'
  | 'users'
  | 'units'
  | 'clans'
  | 'households'
  | 'periods'
  | 'progress'
  | 'scores'
  | 'criteria'
  | 'bonusCategories'
  | 'penaltyCategories'
  | 'titleCategories'
  | 'householdTypes';

interface AppDataPayload {
  communes?: Commune[];
  users?: User[];
  units?: Unit[];
  clans?: Clan[];
  households?: Household[];
  periods?: EvaluationPeriod[];
  progress?: (UnitPeriodProgress & { id?: string })[];
  scores?: EvaluationScoreItem[];
  criteria?: CriterionItem[];
  bonusCategories?: BonusCategory[];
  penaltyCategories?: PenaltyCategory[];
  titleCategories?: TitleCategory[];
  householdTypes?: HouseholdTypeCategory[];
}

const saveTableToDatabase = async (tableName: DataTableName, rows: unknown[]) => {
  const response = await fetch(`/api/data/${tableName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    throw new Error(`Không thể lưu bảng ${tableName} vào cơ sở dữ liệu.`);
  }
};

const stripProgressIds = (rows: (UnitPeriodProgress & { id?: string })[]): UnitPeriodProgress[] =>
  rows.map(({ id, ...row }) => row);

export interface SaveScoreInput {
  id?: string;
  periodId: string;
  targetType: 'household' | 'unit' | 'clan';
  targetId: string;
  targetName: string;
  unitId: string;
  unitName: string;
  criteriaScores: CriteriaScoreMap;
  itemScores?: Record<string, number>;
  bonusPoints: number;
  penaltyPoints: number;
  comments?: string;
  totalStandardScore?: number;
  finalScore?: number;
  isQualified?: boolean;
  isExemplary?: boolean;
  hasViolation?: boolean;
  violationDetails?: string;
  evidenceFiles?: EvidenceFile[];
  returnStatus?: 'none' | 'returned_for_revision';
  returnReason?: string;
  evaluatedByLevel?: 'to' | 'xa';
}

export interface ScoringStandardDef {
  key: StandardKey;
  label: string; // Tên nhóm tiêu chuẩn ngắn gọn để hiển thị trên phiếu chấm
  maxPoints: number; // Tổng điểm tối đa của nhóm (cộng dồn từ các tiêu chí con trong danh mục)
  items: CriterionItem[]; // Các tiêu chí con thuộc nhóm này (để hiển thị gợi ý/hướng dẫn chấm)
}

// Tên nhóm tiêu chuẩn hiển thị theo loại đối tượng (giống nhau giữa các vùng miền)
const STANDARD_LABELS: Record<'household' | 'unit' | 'clan', Partial<Record<StandardKey, string>>> = {
  household: {
    standard1: 'Gương mẫu chấp hành pháp luật',
    standard2: 'Tích cực tham gia phong trào',
    standard3: 'Gia đình no ấm, hạnh phúc',
    standard4: 'Môi trường, an ninh trật tự',
  },
  unit: {
    standard1: 'Đời sống kinh tế ổn định',
    standard2: 'Đời sống văn hóa, tinh thần',
    standard3: 'Môi trường an toàn, sạch đẹp',
    standard4: 'Chấp hành pháp luật, ANTT',
    standard5: 'Đoàn kết, tương trợ cộng đồng',
  },
  clan: {
    standard1: 'Tiêu chuẩn 1',
    standard2: 'Tiêu chuẩn 2',
    standard3: 'Tiêu chuẩn 3',
    standard4: 'Tiêu chuẩn 4',
  },
};

const sumStandardMaxPoints = (standards: ScoringStandardDef[]) =>
  standards.reduce((sum, standard) => sum + standard.maxPoints, 0);

const distributeExactStandardScore = (standards: ScoringStandardDef[], targetScore: number): CriteriaScoreMap => {
  const totalMaxPoints = sumStandardMaxPoints(standards);
  const cappedTarget = Math.max(0, Math.min(totalMaxPoints, Math.round(targetScore)));

  if (totalMaxPoints <= 0 || standards.length === 0) {
    return {};
  }

  const weightedParts = standards.map((standard) => {
    const exact = (standard.maxPoints * cappedTarget) / totalMaxPoints;
    const base = Math.floor(exact);
    return {
      standard,
      base,
      remainder: exact - base,
    };
  });

  let remaining = cappedTarget - weightedParts.reduce((sum, part) => sum + part.base, 0);
  const result: CriteriaScoreMap = {};

  weightedParts
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((part) => {
      const canAdd = remaining > 0 && part.base < part.standard.maxPoints;
      result[part.standard.key] = part.base + (canAdd ? 1 : 0);
      if (canAdd) remaining -= 1;
    });

  return result;
};

const distributeRatioStandardScore = (standards: ScoringStandardDef[], ratio: number): CriteriaScoreMap => {
  const totalMaxPoints = sumStandardMaxPoints(standards);
  return distributeExactStandardScore(standards, totalMaxPoints * ratio);
};

const normalizeCommuneType = (communeType?: string): Commune['communeType'] => {
  if (communeType === 'xa') return '1';
  if (communeType === 'phuong') return '2';
  if (communeType === 'thi_tran') return '3';
  if (communeType === '1' || communeType === '2' || communeType === '3') return communeType;
  return '1';
};

const resolveCommuneMeta = (communes: Commune[], communeId?: string) => {
  const commune = communes.find((item) => item.id === communeId);
  return {
    communeId: commune?.id || '',
    communeName: commune?.name || '',
  };
};

interface AppContextType {
  // Commune selection & multi-tenant
  communes: Commune[];
  selectedCommuneId: string;
  selectedCommune: Commune | undefined;
  terms: AdministrativeTerms;
  setSelectedCommuneId: (id: string) => void;
  addCommune: (commune: Omit<Commune, 'id'>) => void;
  updateCommune: (id: string, commune: Partial<Commune>) => void;
  deleteCommune: (id: string) => void;

  currentUser: User | null;
  users: User[];
  units: Unit[]; // Scoped to selected commune
  allUnits: Unit[];
  clans: Clan[]; // Scoped to selected commune
  allClans: Clan[];
  households: Household[]; // Scoped to selected commune
  allHouseholds: Household[];
  periods: EvaluationPeriod[]; // Scoped to selected commune
  allPeriods: EvaluationPeriod[];
  selectedPeriodId: string;
  selectedPeriod: EvaluationPeriod | undefined;
  progressList: UnitPeriodProgress[];
  scores: EvaluationScoreItem[];

  // Master Data Catalogs (Các danh mục)
  criteria: CriterionItem[];
  bonusCategories: BonusCategory[];
  penaltyCategories: PenaltyCategory[];
  titleCategories: TitleCategory[];
  householdTypes: HouseholdTypeCategory[];

  // Lấy bộ tiêu chuẩn chấm điểm (nhóm + điểm tối đa) đúng theo loại đối tượng & vùng miền
  getScoringStandards: (
    targetType: 'household' | 'unit' | 'clan',
    regionType?: 'dong_bang' | 'mien_nui'
  ) => ScoringStandardDef[];

  // Master Data Methods
  addCriterion: (item: Omit<CriterionItem, 'id'>) => void;
  updateCriterion: (id: string, item: Partial<CriterionItem>) => void;
  deleteCriterion: (id: string) => void;
  resetCriteria: () => void;

  addBonusCategory: (item: Omit<BonusCategory, 'id'>) => void;
  updateBonusCategory: (id: string, item: Partial<BonusCategory>) => void;
  deleteBonusCategory: (id: string) => void;
  resetBonusCategories: () => void;

  addPenaltyCategory: (item: Omit<PenaltyCategory, 'id'>) => void;
  updatePenaltyCategory: (id: string, item: Partial<PenaltyCategory>) => void;
  deletePenaltyCategory: (id: string) => void;
  resetPenaltyCategories: () => void;

  addTitleCategory: (item: Omit<TitleCategory, 'id'>) => void;
  updateTitleCategory: (id: string, item: Partial<TitleCategory>) => void;
  deleteTitleCategory: (id: string) => void;
  resetTitleCategories: () => void;

  addHouseholdType: (item: Omit<HouseholdTypeCategory, 'id'>) => void;
  updateHouseholdType: (id: string, item: Partial<HouseholdTypeCategory>) => void;
  deleteHouseholdType: (id: string) => void;
  resetHouseholdTypes: () => void;

  // Auth
  login: (username: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (targetUserId: string) => Promise<{ success: boolean; message?: string }>;
  switchUser: (username: string) => void;
  logout: () => void;

  // Selection
  setSelectedPeriodId: (id: string) => void;

  // Units
  addUnit: (unit: Omit<Unit, 'id' | 'communeId'> & { communeId?: string }) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;
  importUnits: (newUnits: (Omit<Unit, 'id' | 'communeId'> & { communeId?: string })[]) => void;

  // Clans & Recognition
  addClan: (clan: Omit<Clan, 'id' | 'communeId'> & { communeId?: string }) => void;
  updateClan: (id: string, clan: Partial<Clan>) => void;
  deleteClan: (id: string) => void;
  importClans: (newClans: (Omit<Clan, 'id' | 'communeId'> & { communeId?: string })[]) => void;
  updateClanCulturalRecognition: (
    clanId: string,
    data: {
      culturalStatus: ClanCulturalStatus;
      recognitionYear?: number;
      decisionNumber?: string;
      decisionDate?: string;
      achievements?: string;
      communeNotes?: string;
    }
  ) => void;

  // Households
  addHousehold: (hh: Omit<Household, 'id' | 'communeId'> & { communeId?: string }) => void;
  updateHousehold: (id: string, hh: Partial<Household>) => void;
  deleteHousehold: (id: string) => void;
  importHouseholds: (newHhs: (Omit<Household, 'id' | 'communeId'> & { communeId?: string })[]) => Promise<void>;

  // Users
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Periods
  addPeriod: (p: Omit<EvaluationPeriod, 'id' | 'communeId'> & { communeId?: string }) => void;
  updatePeriod: (id: string, p: Partial<EvaluationPeriod>) => void;
  deletePeriod: (id: string) => void;

  // Scoring & Submissions
  saveScore: (scoreData: SaveScoreInput) => { success: boolean; message: string };
  submitUnitDataToXa: (unitId: string, periodId: string, notes?: string) => { success: boolean; message: string };
  approveAndLockUnit: (unitId: string, periodId: string, notes?: string) => { success: boolean; message: string };
  quickPassUnit: (unitId: string, periodId: string) => { success: boolean; message: string };
  returnUnitSubmission: (unitId: string, periodId: string, returnReason: string) => { success: boolean; message: string };
  returnHouseholdScore: (householdId: string, periodId: string, returnReason: string) => { success: boolean; message: string };
  batchScoreHouseholds: (inputs: {
    householdIds: string[];
    periodId: string;
    unitId: string;
    unitName: string;
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation' | 'ratio_90' | 'ratio_95';
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }) => { success: boolean; message: string; count: number };
  toggleExemplaryHousehold: (householdId: string, periodId: string) => { success: boolean; isExemplary: boolean };
  updatePeriodDecisionFile: (
    periodId: string,
    data: {
      decisionNumber: string;
      decisionDate: string;
      decisionSigner: string;
      decisionFile?: EvidenceFile;
      isFinalized?: boolean;
    }
  ) => { success: boolean; message: string };
  updateUnitReportFiles: (
    unitId: string,
    periodId: string,
    reportFiles: EvidenceFile[]
  ) => { success: boolean; message: string };
  addEvidenceToHousehold: (
    householdId: string,
    periodId: string,
    evidenceFile: EvidenceFile,
    violationDetails?: string
  ) => { success: boolean; message: string };

  // Utility helpers
  getUnitProgress: (unitId: string, periodId?: string) => UnitPeriodProgress;
  isPeriodExpired: (period?: EvaluationPeriod) => boolean;
  canEditUnitScores: (unitId: string, periodId?: string) => { allowed: boolean; reason?: string };
  canEditHouseholdScore: (householdId: string, unitId: string, periodId?: string) => { allowed: boolean; reason?: string; isReturned?: boolean };
  recallUnitSubmission: (unitId: string, periodId: string) => { success: boolean; message: string };
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Communes (Xã / Phường)
  const [communes, setCommunes] = useState<Commune[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);

  const [selectedCommuneId, setSelectedCommuneIdState] = useState<string>('');

  // All Units
  const [allUnits, setAllUnits] = useState<Unit[]>([]);

  // All Clans
  const [allClans, setAllClans] = useState<Clan[]>([]);

  // All Households
  const [allHouseholds, setAllHouseholds] = useState<Household[]>([]);

  // All Periods (Xã/phường tự tạo)
  const [allPeriods, setAllPeriods] = useState<EvaluationPeriod[]>([]);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  const [progressList, setProgressList] = useState<UnitPeriodProgress[]>([]);

  const [scores, setScores] = useState<EvaluationScoreItem[]>([]);

  // Master Data Catalogs
  const [criteria, setCriteria] = useState<CriterionItem[]>([]);

  const [bonusCategories, setBonusCategories] = useState<BonusCategory[]>([]);

  const [penaltyCategories, setPenaltyCategories] = useState<PenaltyCategory[]>([]);

  const [titleCategories, setTitleCategories] = useState<TitleCategory[]>([]);

  const [householdTypes, setHouseholdTypes] = useState<HouseholdTypeCategory[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu từ cơ sở dữ liệu.');
        }

        const data = (await response.json()) as AppDataPayload;
        if (cancelled) return;

        const dbCommunes = (data.communes || []).map((commune) => ({
          ...commune,
          communeType: normalizeCommuneType(commune.communeType),
        }));
        const dbUsers = data.users || [];
        const dbUnits = data.units || [];
        const dbClans = data.clans || [];
        const dbHouseholds = data.households || [];
        const dbPeriods = data.periods || [];
        const firstCommuneId = dbCommunes[0]?.id || '';
        const firstPeriod = dbPeriods.find((p) => p.communeId === firstCommuneId && p.status === 'active')
          || dbPeriods.find((p) => p.communeId === firstCommuneId)
          || dbPeriods[0];

        setCommunes(dbCommunes);
        setUsers(dbUsers);
        setSelectedCommuneIdState(firstCommuneId);
        setAllUnits(dbUnits);
        setAllClans(dbClans);
        setAllHouseholds(dbHouseholds);
        setAllPeriods(dbPeriods);
        setSelectedPeriodId(firstPeriod?.id || '');
        setProgressList(stripProgressIds(data.progress || []));
        setScores(data.scores || []);
        setCriteria(data.criteria || []);
        setBonusCategories(data.bonusCategories || []);
        setPenaltyCategories(data.penaltyCategories || []);
        setTitleCategories(data.titleCategories || []);
        setHouseholdTypes(data.householdTypes || []);
        setIsDbLoaded(true);
      } catch (error) {
        console.error('Không thể tải dữ liệu từ DB:', error);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistTable = (tableName: DataTableName, rows: unknown[]) => {
    if (!isDbLoaded) return;

    saveTableToDatabase(tableName, rows).catch((error) => {
      console.error(error);
    });
  };

  useEffect(() => persistTable('communes', communes), [communes, isDbLoaded]);
  useEffect(() => persistTable('users', users), [users, isDbLoaded]);
  useEffect(() => persistTable('units', allUnits), [allUnits, isDbLoaded]);
  useEffect(() => persistTable('clans', allClans), [allClans, isDbLoaded]);
  useEffect(() => persistTable('households', allHouseholds), [allHouseholds, isDbLoaded]);
  useEffect(() => persistTable('periods', allPeriods), [allPeriods, isDbLoaded]);
  useEffect(() => persistTable('progress', progressList), [progressList, isDbLoaded]);
  useEffect(() => persistTable('scores', scores), [scores, isDbLoaded]);
  useEffect(() => persistTable('criteria', criteria), [criteria, isDbLoaded]);
  useEffect(() => persistTable('bonusCategories', bonusCategories), [bonusCategories, isDbLoaded]);
  useEffect(() => persistTable('penaltyCategories', penaltyCategories), [penaltyCategories, isDbLoaded]);
  useEffect(() => persistTable('titleCategories', titleCategories), [titleCategories, isDbLoaded]);
  useEffect(() => persistTable('householdTypes', householdTypes), [householdTypes, isDbLoaded]);

  useEffect(() => {
    if (currentUser && currentUser.communeId && currentUser.communeId !== selectedCommuneId) {
      if (currentUser.role === 'to_truong' || currentUser.role === 'can_bo_xa') {
        setSelectedCommuneId(currentUser.communeId);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (communes.length === 0) return;
    const hasSelected = communes.some((commune) => commune.id === selectedCommuneId);
    if (hasSelected) return;

    const fallbackCommuneId = communes.some((commune) => commune.id === currentUser?.communeId)
      ? currentUser?.communeId
      : communes[0]?.id;

    if (fallbackCommuneId) {
      setSelectedCommuneIdState(fallbackCommuneId);
    }
  }, [communes, currentUser?.communeId, selectedCommuneId]);

  // Active Commune
  const effectiveSelectedCommuneId = communes.some((commune) => commune.id === selectedCommuneId)
    ? selectedCommuneId
    : (communes[0]?.id || '');
  const selectedCommune = communes.find((c) => c.id === effectiveSelectedCommuneId) || communes[0];
  const terms = useMemo(() => getAdministrativeTerms(selectedCommune), [selectedCommune]);

  // Scoped Data by Selected Commune
  const communeUnits = allUnits.filter((u) => u.communeId === effectiveSelectedCommuneId);
  const clans = allClans.filter((c) => c.communeId === effectiveSelectedCommuneId);
  const households = allHouseholds.filter(
    (h) => communeUnits.some((u) => u.id === h.unitId) || h.communeId === effectiveSelectedCommuneId
  );
  const units = communeUnits.map((unit) => {
    const unitHouseholds = allHouseholds.filter((household) => household.unitId === unit.id);
    return {
      ...unit,
      totalHouseholds: unitHouseholds.length,
      totalPopulation: unitHouseholds.reduce((total, household) => total + (household.memberCount ?? 0), 0),
    };
  });
  const periods = allPeriods.filter((p) => p.communeId === effectiveSelectedCommuneId);

  // Keep selectedPeriodId synchronized with valid periods
  useEffect(() => {
    if (periods.length > 0 && (!selectedPeriodId || !periods.some((p) => p.id === selectedPeriodId))) {
      const active = periods.find((p) => p.status === 'active') || periods[0];
      setSelectedPeriodId(active.id);
    }
  }, [periods, selectedPeriodId]);

  // When switching commune, ensure selected period matches one of this commune's periods
  const setSelectedCommuneId = (communeId: string) => {
    setSelectedCommuneIdState(communeId);
    const communeSpecificPeriods = allPeriods.filter((p) => p.communeId === communeId);
    if (communeSpecificPeriods.length > 0) {
      const active = communeSpecificPeriods.find((p) => p.status === 'active') || communeSpecificPeriods[0];
      setSelectedPeriodId(active.id);
    } else {
      setSelectedPeriodId('');
    }
  };

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

  // Utility checking period expiration
  const isPeriodExpired = (period?: EvaluationPeriod): boolean => {
    if (!period) return false;
    if (period.status === 'closed') return true;
    const now = new Date();
    const end = new Date(period.endDate);
    end.setHours(23, 59, 59, 999);
    return now.getTime() > end.getTime();
  };

  // Get progress for a unit in a period
  const getUnitProgress = (unitId: string, periodId?: string): UnitPeriodProgress => {
    const pid = periodId || selectedPeriodId;
    const existing = progressList.find((p) => p.unitId === unitId && p.periodId === pid);
    if (existing) return existing;
    return {
      unitId,
      periodId: pid,
      status: 'chua_gui',
    };
  };

  // Permission: Can the user edit scores for a unit in a period?
  const canEditUnitScores = (unitId: string, periodId?: string): { allowed: boolean; reason?: string } => {
    if (!unitId || unitId.trim() === '' || unitId === 'chua_phan') {
      return {
        allowed: false,
        reason: 'Hộ gia đình chưa được phân bổ vào Thôn / Tổ nào. Vui lòng phân Thôn / Tổ trước khi chấm điểm.',
      };
    }

    const pid = periodId || selectedPeriodId;
    const targetPeriod = periods.find((p) => p.id === pid) || allPeriods.find((p) => p.id === pid);

    if (!currentUser) return { allowed: false, reason: 'Chưa đăng nhập.' };

    const prog = getUnitProgress(unitId, pid);

    if (prog.status === 'da_chot') {
      return {
        allowed: false,
        reason: 'Hồ sơ đơn vị này đã được UBND Xã DUYỆT CHỐT chính thức. Không thể sửa đổi.',
      };
    }

    if (currentUser.role === 'to_truong') {
      if (currentUser.unitId && currentUser.unitId !== unitId) {
        return {
          allowed: false,
          reason: 'Tổ trưởng chỉ được phép chấm điểm cho thôn/tổ phụ trách của mình.',
        };
      }

      if (isPeriodExpired(targetPeriod)) {
        return {
          allowed: false,
          reason: 'Đợt xét này đã hết hạn quy định. Tổ/thôn không được tiếp tục chấm điểm.',
        };
      }

      if (prog.status === 'da_gui') {
        return {
          allowed: false,
          reason: 'Tổ đã gửi dữ liệu lên xã. Để tiếp tục chỉnh sửa, vui lòng bấm "Thu hồi hồ sơ" hoặc chờ Xã duyệt/trả lại.',
        };
      }
    }

    return { allowed: true };
  };

  // Permission: Can the user edit/re-score a specific household?
  const canEditHouseholdScore = (householdId: string, unitId: string, periodId?: string): { allowed: boolean; reason?: string; isReturned?: boolean } => {
    const pid = periodId || selectedPeriodId;
    const prog = getUnitProgress(unitId, pid);
    if (prog.status === 'da_chot') {
      return { allowed: false, reason: 'Hồ sơ đơn vị này đã được UBND Xã DUYỆT CHỐT chính thức. Không thể sửa đổi.' };
    }
    const sc = scores.find((s) => s.periodId === pid && s.targetType === 'household' && s.targetId === householdId);
    if (sc?.returnStatus === 'returned_for_revision') {
      return { allowed: true, isReturned: true };
    }
    return canEditUnitScores(unitId, pid);
  };

  // Auth handlers
  const login = async (username: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        return { success: false, message: result.message || 'Đăng nhập thất bại.' };
      }

      setCurrentUser(result.user as User);
      if (result.user.communeId) setSelectedCommuneId(result.user.communeId);
      return { success: true };
    } catch {
      return { success: false, message: 'Không thể kết nối máy chủ xác thực.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập lại.' };
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, currentPassword, newPassword }),
      });
      const result = await response.json();
      return { success: response.ok && result.success, message: result.message };
    } catch {
      return { success: false, message: 'Không thể kết nối máy chủ để đổi mật khẩu.' };
    }
  };

  const resetUserPassword = async (targetUserId: string) => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập lại.' };
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const result = await response.json();
      return { success: response.ok && result.success, message: result.message };
    } catch {
      return { success: false, message: 'Không thể kết nối máy chủ để đặt lại mật khẩu.' };
    }
  };

  const switchUser = (username: string) => {
    const user = users.find((u) => u.username === username);
    if (user) {
      setCurrentUser(user);
      if (user.communeId) {
        setSelectedCommuneId(user.communeId);
      }
    }
  };

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setCurrentUser(null);
  };

  // Commune CRUD
  const addCommune = (commune: Omit<Commune, 'id'>) => {
    const newCommune: Commune = {
      ...commune,
      id: `commune-${Date.now()}`,
    };
    setCommunes((prev) => [...prev, newCommune]);
  };

  const updateCommune = (id: string, updated: Partial<Commune>) => {
    setCommunes((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCommune = (id: string) => {
    if (communes.length <= 1) {
      alert('Không thể xóa xã/phường duy nhất trong hệ thống!');
      return;
    }
    setCommunes((prev) => prev.filter((c) => c.id !== id));
    if (selectedCommuneId === id) {
      const remaining = communes.filter((c) => c.id !== id);
      setSelectedCommuneId(remaining[0].id);
    }
  };

  // Unit CRUD
  const addUnit = (unit: Omit<Unit, 'id' | 'communeId'> & { communeId?: string }) => {
    const targetCommune = resolveCommuneMeta(communes, unit.communeId || selectedCommuneId);
    const newUnit: Unit = {
      ...unit,
      id: `unit-${Date.now()}`,
      communeId: targetCommune.communeId || selectedCommuneId,
      communeName: unit.communeName || targetCommune.communeName,
    };
    setAllUnits((prev) => [...prev, newUnit]);
  };

  const updateUnit = (id: string, updated: Partial<Unit>) => {
    const targetCommune = resolveCommuneMeta(communes, updated.communeId);
    setAllUnits((prev) => prev.map((u) => (u.id === id ? {
      ...u,
      ...updated,
      communeName: updated.communeId
        ? (updated.communeName || targetCommune.communeName)
        : (updated.communeName || u.communeName),
    } : u)));
    if (updated.name) {
      setAllClans((prev) => prev.map((c) => (c.unitId === id ? { ...c, unitName: updated.name! } : c)));
      setAllHouseholds((prev) => prev.map((h) => (h.unitId === id ? { ...h, unitName: updated.name! } : h)));
      setScores((prev) => prev.map((s) => (s.unitId === id ? { ...s, unitName: updated.name! } : s)));
    }
  };

  const deleteUnit = (id: string) => {
    setAllUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const importUnits = (newUnits: (Omit<Unit, 'id' | 'communeId'> & { communeId?: string })[]) => {
    const created: Unit[] = newUnits.map((u, i) => {
      const targetCommune = resolveCommuneMeta(communes, u.communeId || selectedCommuneId);
      return {
        ...u,
        id: `unit-${Date.now()}-${i}`,
        communeId: targetCommune.communeId || selectedCommuneId,
        communeName: u.communeName || targetCommune.communeName,
      };
    });
    setAllUnits((prev) => [...prev, ...created]);
  };

  // Clan CRUD & Commune Recognition
  const addClan = (clan: Omit<Clan, 'id' | 'communeId'> & { communeId?: string }) => {
    const newClan: Clan = {
      ...clan,
      id: `clan-${Date.now()}`,
      communeId: clan.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
      culturalStatus: clan.culturalStatus || 'chua_cong_nhan',
    };
    setAllClans((prev) => [...prev, newClan]);
  };

  const updateClan = (id: string, updated: Partial<Clan>) => {
    setAllClans((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const updateClanCulturalRecognition = (
    clanId: string,
    data: {
      culturalStatus: ClanCulturalStatus;
      recognitionYear?: number;
      decisionNumber?: string;
      decisionDate?: string;
      achievements?: string;
      communeNotes?: string;
    }
  ) => {
    setAllClans((prev) =>
      prev.map((c) =>
        c.id === clanId
          ? {
              ...c,
              ...data,
            }
          : c
      )
    );
  };

  const deleteClan = (id: string) => {
    setAllClans((prev) => prev.filter((c) => c.id !== id));
  };

  const importClans = (newClans: (Omit<Clan, 'id' | 'communeId'> & { communeId?: string })[]) => {
    const created: Clan[] = newClans.map((c, i) => ({
      ...c,
      id: `clan-${Date.now()}-${i}`,
      communeId: c.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
      culturalStatus: c.culturalStatus || 'chua_cong_nhan',
    }));
    setAllClans((prev) => [...prev, ...created]);
  };

  // Household CRUD
  const addHousehold = (hh: Omit<Household, 'id' | 'communeId'> & { communeId?: string }) => {
    const unitObj = units.find((u) => u.id === hh.unitId);
    const resolvedUnitName = unitObj ? unitObj.name : (hh.unitName || 'Chưa phân');
    const newHh: Household = {
      ...hh,
      unitName: resolvedUnitName,
      id: `hh-${Date.now()}`,
      communeId: hh.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
    };
    setAllHouseholds((prev) => [...prev, newHh]);
  };

  const updateHousehold = (id: string, updated: Partial<Household>) => {
    setAllHouseholds((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const merged = { ...h, ...updated };
        const unitObj = units.find((u) => u.id === merged.unitId);
        const resolvedUnitName = unitObj ? unitObj.name : (merged.unitName || 'Chưa phân');
        return {
          ...merged,
          unitName: resolvedUnitName,
        };
      })
    );
  };

  const deleteHousehold = (id: string) => {
    setAllHouseholds((prev) => prev.filter((h) => h.id !== id));
  };

  const importHouseholds = async (newHhs: (Omit<Household, 'id' | 'communeId'> & { communeId?: string })[]) => {
    const created: Household[] = newHhs.map((h, i) => {
      const unitObj = units.find((u) => u.id === h.unitId);
      const resolvedUnitName = unitObj ? unitObj.name : (h.unitName || 'Chưa phân');
      return {
        ...h,
        unitName: resolvedUnitName,
        id: `hh-${Date.now()}-${i}`,
        communeId: h.communeId || selectedCommuneId,
        communeName: selectedCommune?.name || '',
      };
    });
    const nextHouseholds = [...allHouseholds, ...created];
    await saveTableToDatabase('households', nextHouseholds);
    setAllHouseholds(nextHouseholds);
  };

  // User CRUD
  const addUser = (user: Omit<User, 'id'>) => {
    const targetCommune = communes.find((commune) => commune.id === (user.communeId || selectedCommuneId));
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      communeId: user.communeId || selectedCommuneId,
      communeName: user.communeName || targetCommune?.name || '',
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) {
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Period CRUD - Xã/phường tự tạo đợt xét cho mình dùng
  const addPeriod = (p: Omit<EvaluationPeriod, 'id' | 'communeId'> & { communeId?: string }) => {
    const newP: EvaluationPeriod = {
      ...p,
      id: `period-${Date.now()}`,
      communeId: p.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
    };
    setAllPeriods((prev) => [newP, ...prev]);
    setSelectedPeriodId(newP.id);
  };

  const updatePeriod = (id: string, updated: Partial<EvaluationPeriod>) => {
    setAllPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deletePeriod = (id: string) => {
    setAllPeriods((prev) => prev.filter((p) => p.id !== id));
    if (selectedPeriodId === id) {
      const remaining = periods.filter((p) => p.id !== id);
      if (remaining.length > 0) setSelectedPeriodId(remaining[0].id);
      else setSelectedPeriodId('');
    }
  };

  // Scoring
  const saveScore = (scoreData: SaveScoreInput): { success: boolean; message: string } => {
    const existingIndex = scores.findIndex(
      (s) =>
        s.periodId === scoreData.periodId &&
        s.targetType === scoreData.targetType &&
        s.targetId === scoreData.targetId
    );

    const existing = existingIndex >= 0 ? scores[existingIndex] : undefined;
    const isReturnedHousehold = existing?.returnStatus === 'returned_for_revision';

    const prog = getUnitProgress(scoreData.unitId, scoreData.periodId);
    if (prog.status === 'da_chot') {
      return { success: false, message: 'Hồ sơ đơn vị này đã được UBND Xã DUYỆT CHỐT chính thức. Không thể sửa đổi.' };
    }

    const check = canEditUnitScores(scoreData.unitId, scoreData.periodId);
    if (!check.allowed && !isReturnedHousehold) {
      return { success: false, message: check.reason || 'Không được phép chỉnh sửa điểm.' };
    }

    const totalStandardScore = Object.values(scoreData.criteriaScores).reduce(
      (sum, v) => sum + (v || 0),
      0
    );

    const bonus = scoreData.bonusPoints || 0;
    const penalty = scoreData.penaltyPoints || 0;
    const finalScore = Math.max(0, Math.min(100, totalStandardScore + bonus - penalty));
    const isQualified = finalScore >= 90;

    const evalLevel = currentUser?.role === 'to_truong' ? 'to' : 'xa';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const wasReturned = isReturnedHousehold;
    const completeScore: EvaluationScoreItem = {
      id: scoreData.id || existing?.id || `sc-${Date.now()}`,
      periodId: scoreData.periodId,
      targetType: scoreData.targetType,
      targetId: scoreData.targetId,
      targetName: scoreData.targetName,
      unitId: scoreData.unitId,
      unitName: scoreData.unitName,
      criteriaScores: scoreData.criteriaScores,
      itemScores: scoreData.itemScores ?? existing?.itemScores,
      bonusPoints: bonus,
      penaltyPoints: penalty,
      totalStandardScore,
      finalScore,
      isQualified,
      isExemplary: scoreData.isExemplary ?? existing?.isExemplary ?? false,
      hasViolation: scoreData.hasViolation ?? existing?.hasViolation ?? (penalty > 0 || !isQualified),
      violationDetails: scoreData.violationDetails ?? existing?.violationDetails,
      evidenceFiles: scoreData.evidenceFiles ?? existing?.evidenceFiles ?? [],
      returnStatus: scoreData.returnStatus !== undefined
        ? scoreData.returnStatus
        : wasReturned
          ? 'revised'
          : (existing?.returnStatus ?? 'none'),
      revisedAt: wasReturned ? nowStr : existing?.revisedAt,
      returnReason: scoreData.returnReason ?? existing?.returnReason,
      evaluatedByLevel: evalLevel,
      comments: scoreData.comments,
      updatedAt: nowStr,
    };

    setScores((prev) => {
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = completeScore;
        return next;
      }
      return [...prev, completeScore];
    });

    return {
      success: true,
      message: wasReturned
        ? `Đã hoàn tất chấm lại điểm cho ${scoreData.targetName} thành công!`
        : 'Đã lưu điểm đánh giá thành công!',
    };
  };

  // Submit Unit Data to Commune
  const submitUnitDataToXa = (unitId: string, periodId: string, notes?: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'to_truong') {
      return {
        success: false,
        message: 'Chỉ tài khoản Thôn/Tổ mới được gửi dữ liệu lên Xã/Phường.',
      };
    }

    const prog = getUnitProgress(unitId, periodId);
    if (prog.status === 'da_chot') {
      return { success: false, message: 'Hồ sơ đã được duyệt chốt trước đó, không thể gửi lại!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedProgress: UnitPeriodProgress = {
      ...prog,
      unitId,
      periodId,
      status: 'da_gui',
      submittedAt: nowStr,
      submittedBy: currentUser?.fullName || 'Tổ trưởng',
      notes: notes || prog.notes || 'Đã nộp dữ liệu các hộ và tự chấm thôn/tổ lên UBND xã thẩm định.',
    };

    setProgressList((prev) => {
      const idx = prev.findIndex((p) => p.unitId === unitId && p.periodId === periodId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProgress;
        return next;
      }
      return [...prev, updatedProgress];
    });

    return {
      success: true,
      message: 'Đã gửi dữ liệu thành công lên UBND Xã/Phường! Dữ liệu cấp tổ đã được khóa an toàn.',
    };
  };

  // Recall submission (Thu hồi hồ sơ đã nộp để chỉnh sửa tiếp)
  const recallUnitSubmission = (unitId: string, periodId: string): { success: boolean; message: string } => {
    const prog = getUnitProgress(unitId, periodId);
    if (prog.status === 'da_chot') {
      return { success: false, message: 'Hồ sơ đã được UBND Xã duyệt chốt chính thức, không thể thu hồi!' };
    }
    if (prog.status !== 'da_gui') {
      return { success: false, message: 'Hồ sơ chưa nộp hoặc đang ở trạng thái chỉnh sửa.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedProgress: UnitPeriodProgress = {
      ...prog,
      unitId,
      periodId,
      status: 'chua_gui',
      notes: `Tổ trưởng đã thu hồi hồ sơ lúc ${nowStr} để rà soát và bổ sung điểm.`,
    };

    setProgressList((prev) => {
      const idx = prev.findIndex((p) => p.unitId === unitId && p.periodId === periodId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProgress;
        return next;
      }
      return [...prev, updatedProgress];
    });

    return {
      success: true,
      message: 'Đã thu hồi hồ sơ thành công! Tổ trưởng hiện có thể tiếp tục chấm và sửa đổi điểm cho các hộ.',
    };
  };

  // Approve & Lock
  const approveAndLockUnit = (unitId: string, periodId: string, notes?: string): { success: boolean; message: string } => {
    if (currentUser?.role === 'to_truong') {
      return { success: false, message: 'Chỉ Cán bộ Xã hoặc Quản trị viên mới có quyền Duyệt chốt dữ liệu!' };
    }

    const prog = getUnitProgress(unitId, periodId);
    if (prog.status === 'da_chot') {
      return { success: false, message: 'Đơn vị này đã được chốt trước đó!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedProgress: UnitPeriodProgress = {
      ...prog,
      unitId,
      periodId,
      status: 'da_chot',
      approvedAt: nowStr,
      approvedBy: currentUser?.fullName || 'Cán bộ Xã',
      notes: notes || 'UBND Xã đã thẩm định và Duyệt chốt chính thức hồ sơ văn hóa.',
    };

    setScores((prev) =>
      prev.map((s) => {
        if (s.unitId === unitId && s.periodId === periodId) {
          return {
            ...s,
            evaluatedByLevel: 'xa',
            updatedAt: nowStr,
          };
        }
        return s;
      })
    );

    setProgressList((prev) => {
      const idx = prev.findIndex((p) => p.unitId === unitId && p.periodId === periodId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProgress;
        return next;
      }
      return [...prev, updatedProgress];
    });

    return {
      success: true,
      message: 'Đã DUYỆT CHỐT thành công dữ liệu đơn vị! Hồ sơ chính thức được khóa vĩnh viễn.',
    };
  };

  // Quick pass for a unit (Chỉ chấm cho Thôn/Tổ và các Hộ gia đình thuộc thôn/tổ đó, Tộc họ do Xã trực tiếp công nhận)
  const quickPassUnit = (unitId: string, periodId: string): { success: boolean; message: string } => {
    const prog = getUnitProgress(unitId, periodId);
    if (prog.status === 'da_chot') {
      return { success: false, message: 'Đơn vị đã chốt, không thể thay đổi điểm!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const unitObj = allUnits.find((u) => u.id === unitId);
    const unitName = unitObj?.name || 'Thôn/Tổ';
    const targetHhs = allHouseholds.filter((h) => h.unitId === unitId);

    // Đúng bộ tiêu chuẩn Thôn/Tổ & Hộ gia đình theo vùng miền của xã/phường đang chọn
    const unitStandards = getScoringStandards('unit', selectedCommune?.regionType);
    const hhStandards = getScoringStandards('household', selectedCommune?.regionType);
    const buildScores = (stds: ScoringStandardDef[], ratio: number): CriteriaScoreMap =>
      distributeRatioStandardScore(stds, ratio);

    const newScores: EvaluationScoreItem[] = [];

    // Tự chấm điểm Thôn/Tổ
    const unitCriteriaScores = buildScores(unitStandards, 0.95);
    const unitTotal = Object.values(unitCriteriaScores).reduce((sum, v) => sum + (v || 0), 0);
    newScores.push({
      id: `sc-unit-${unitId}-${periodId}`,
      periodId,
      targetType: 'unit',
      targetId: unitId,
      targetName: unitName,
      unitId,
      unitName,
      criteriaScores: unitCriteriaScores,
      bonusPoints: 1,
      penaltyPoints: 0,
      totalStandardScore: unitTotal,
      finalScore: Math.min(100, unitTotal + 1),
      isQualified: true,
      evaluatedByLevel: currentUser?.role === 'to_truong' ? 'to' : 'xa',
      comments: 'Tự chấm đạt chuẩn văn hóa cấp tổ/thôn.',
      updatedAt: nowStr,
    });

    // Chấm các Hộ gia đình trong thôn/tổ
    targetHhs.forEach((hh, i) => {
      const ratio = 0.92 + (i % 3) * 0.02; // luân phiên 92%/94%/96% cho đa dạng dữ liệu mẫu
      const criteriaScores = buildScores(hhStandards, ratio);
      const total = Object.values(criteriaScores).reduce((sum, v) => sum + (v || 0), 0);
      const bonus = (i % 2 === 0) ? 1 : 0;
      const final = Math.min(100, total + bonus);
      newScores.push({
        id: `sc-hh-${hh.id}-${periodId}`,
        periodId,
        targetType: 'household',
        targetId: hh.id,
        targetName: `Hộ ${hh.headName}`,
        unitId,
        unitName,
        criteriaScores,
        bonusPoints: bonus,
        penaltyPoints: 0,
        totalStandardScore: total,
        finalScore: final,
        isQualified: final >= 90,
        evaluatedByLevel: currentUser?.role === 'to_truong' ? 'to' : 'xa',
        comments: 'Tổ tự chấm đạt chuẩn Gia đình văn hóa.',
        updatedAt: nowStr,
      });
    });

    setScores((prev) => {
      const filtered = prev.filter(
        (s) => !(s.unitId === unitId && s.periodId === periodId)
      );
      return [...filtered, ...newScores];
    });

    return {
      success: true,
      message: `Đã tự chấm đạt chuẩn cho ${newScores.length} đối tượng (Thôn/Tổ và ${targetHhs.length} Hộ gia đình)!`,
    };
  };

  // Trả hồ sơ để tổ chấm lại
  const returnUnitSubmission = (unitId: string, periodId: string, returnReason: string): { success: boolean; message: string } => {
    if (currentUser?.role === 'to_truong') {
      return { success: false, message: 'Chỉ Cán bộ Xã/Phường hoặc Quản trị viên mới có quyền trả hồ sơ!' };
    }

    const prog = getUnitProgress(unitId, periodId);
    if (prog.status === 'da_chot') {
      return { success: false, message: 'Hồ sơ đã duyệt chốt, không thể trả lại trừ khi mở khóa!' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedProgress: UnitPeriodProgress = {
      ...prog,
      unitId,
      periodId,
      status: 'tra_lai',
      returnedAt: nowStr,
      returnedBy: currentUser?.fullName || 'Cán bộ Xã',
      returnReason: returnReason.trim() || 'UBND Xã yêu cầu rà soát và chấm lại điểm.',
    };

    setProgressList((prev) => {
      const idx = prev.findIndex((p) => p.unitId === unitId && p.periodId === periodId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProgress;
        return next;
      }
      return [...prev, updatedProgress];
    });

    return {
      success: true,
      message: 'Đã trả hồ sơ thành công về cho Thôn/Tổ! Tổ trưởng có thể tiếp tục chỉnh sửa và nộp lại.',
    };
  };

  // Trả hồ sơ hộ gia đình để tổ chấm lại
  const returnHouseholdScore = (householdId: string, periodId: string, returnReason: string): { success: boolean; message: string } => {
    if (currentUser?.role === 'to_truong') {
      return { success: false, message: 'Chỉ Cán bộ Xã hoặc Quản trị viên mới có quyền trả hồ sơ hộ gia đình!' };
    }
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetHh = allHouseholds.find((h) => h.id === householdId);
    const targetUnitId = targetHh?.unitId;

    if (targetUnitId) {
      const prog = getUnitProgress(targetUnitId, periodId);
      if (prog.status !== 'da_chot') {
        const updatedProgress: UnitPeriodProgress = {
          ...prog,
          unitId: targetUnitId,
          periodId,
          status: 'tra_lai',
          returnedAt: nowStr,
          returnedBy: currentUser?.fullName || 'Cán bộ Xã',
          returnReason: `UBND Xã trả lại hồ sơ hộ ${targetHh?.headName || ''} để Tổ chấm lại: ${returnReason.trim() || 'Rà soát và chấm lại điểm.'}`,
        };
        setProgressList((prev) => {
          const idx = prev.findIndex((p) => p.unitId === targetUnitId && p.periodId === periodId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedProgress;
            return next;
          }
          return [...prev, updatedProgress];
        });
      }
    }

    setScores((prev) =>
      prev.map((s) => {
        if (s.periodId === periodId && s.targetType === 'household' && s.targetId === householdId) {
          return {
            ...s,
            returnStatus: 'returned_for_revision',
            returnReason: returnReason.trim() || 'Cán bộ xã yêu cầu tổ rà soát, thẩm tra và chấm lại điểm hộ này.',
            updatedAt: nowStr,
          };
        }
        return s;
      })
    );
    return { success: true, message: `Đã chuyển trả hồ sơ hộ ${targetHh ? targetHh.headName : ''} về Thôn/Tổ để chấm lại thành công!` };
  };

  // Chấm nhanh nhiều hộ 1 lúc (Batch scoring)
  const batchScoreHouseholds = (inputs: {
    householdIds: string[];
    periodId: string;
    unitId: string;
    unitName: string;
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation' | 'ratio_90' | 'ratio_95';
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }): { success: boolean; message: string; count: number } => {
    const effectiveUnitId = (currentUser?.role === 'to_truong' && currentUser.unitId) ? currentUser.unitId : inputs.unitId;
    const check = canEditUnitScores(effectiveUnitId, inputs.periodId);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Không được phép chỉnh sửa điểm của đơn vị này.', count: 0 };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const evalLevel = currentUser?.role === 'to_truong' ? 'to' : 'xa';

    // Đúng bộ tiêu chuẩn hộ gia đình theo vùng miền của xã/phường đang chọn (không hardcode standard1-4)
    const hhStandards = getScoringStandards('household', selectedCommune?.regionType);
    const distributeByRatio = (ratio: number): CriteriaScoreMap =>
      distributeRatioStandardScore(hhStandards, ratio);
    const distributeByTotal = (total: number): CriteriaScoreMap =>
      distributeExactStandardScore(hhStandards, total);

    setScores((prev) => {
      const updated = [...prev];

      inputs.householdIds.forEach((hhId, idx) => {
        const hhObj = allHouseholds.find((h) => h.id === hhId);
        const hhName = hhObj ? `Hộ ${hhObj.headName}` : 'Hộ gia đình';
        const hhUnitId = hhObj?.unitId || effectiveUnitId;
        const hhUnitName = hhObj?.unitName || inputs.unitName;

        const existingIdx = updated.findIndex(
          (s) => s.periodId === inputs.periodId && s.targetType === 'household' && s.targetId === hhId
        );
        const existing = existingIdx >= 0 ? updated[existingIdx] : undefined;

        if (inputs.mode === 'set_exemplary' || inputs.mode === 'clear_exemplary') {
          const isExemplary = inputs.mode === 'set_exemplary';
          if (existing) {
            updated[existingIdx] = {
              ...existing,
              isExemplary,
              updatedAt: nowStr,
            };
          } else {
            const criteriaScores = distributeByTotal(97);
            const total = Object.values(criteriaScores).reduce((sum, v) => sum + (v || 0), 0);
            updated.push({
              id: `sc-hh-${hhId}-${inputs.periodId}`,
              periodId: inputs.periodId,
              targetType: 'household',
              targetId: hhId,
              targetName: hhName,
              unitId: hhUnitId,
              unitName: hhUnitName,
              criteriaScores,
              bonusPoints: 1,
              penaltyPoints: 0,
              totalStandardScore: total,
              finalScore: Math.min(100, total + 1),
              isQualified: true,
              isExemplary,
              evaluatedByLevel: evalLevel,
              updatedAt: nowStr,
            });
          }
        } else if (inputs.mode === 'violation') {
          const penalty = 15;
          const criteriaScores = distributeByRatio(0.7);
          const total = Object.values(criteriaScores).reduce((sum, v) => sum + (v || 0), 0);
          const finalScore = Math.max(0, total - penalty);
          const scoreObj: EvaluationScoreItem = {
            id: existing?.id || `sc-hh-${hhId}-${inputs.periodId}`,
            periodId: inputs.periodId,
            targetType: 'household',
            targetId: hhId,
            targetName: hhName,
            unitId: hhUnitId,
            unitName: hhUnitName,
            criteriaScores,
            bonusPoints: 0,
            penaltyPoints: penalty,
            totalStandardScore: total,
            finalScore,
            isQualified: false,
            isExemplary: false,
            hasViolation: true,
            violationDetails: inputs.violationDetails || 'Vi phạm nếp sống văn minh / quy ước cơ sở',
            evidenceFiles: inputs.evidenceFiles || existing?.evidenceFiles || [],
            evaluatedByLevel: evalLevel,
            updatedAt: nowStr,
          };
          if (existingIdx >= 0) {
            updated[existingIdx] = scoreObj;
          } else {
            updated.push(scoreObj);
          }
        } else if (inputs.mode === 'ratio_90' || inputs.mode === 'ratio_95') {
          const ratio = inputs.mode === 'ratio_95' ? 0.95 : 0.90;
          const passCount = Math.max(1, Math.ceil(inputs.householdIds.length * ratio));
          const isPass = idx < passCount;

          const bonus = isPass ? (inputs.mode === 'ratio_95' ? 0 : 1) : 0;
          const penalty = isPass ? 0 : 5;
          const criteriaScores = distributeByTotal(isPass ? (inputs.mode === 'ratio_95' ? 97 : 93) : 80);
          const total = Object.values(criteriaScores).reduce((sum, v) => sum + (v || 0), 0);
          const finalScore = Math.max(0, Math.min(100, total + bonus - penalty));

          const scoreObj: EvaluationScoreItem = {
            id: existing?.id || `sc-hh-${hhId}-${inputs.periodId}`,
            periodId: inputs.periodId,
            targetType: 'household',
            targetId: hhId,
            targetName: hhName,
            unitId: hhUnitId,
            unitName: hhUnitName,
            criteriaScores,
            bonusPoints: bonus,
            penaltyPoints: penalty,
            totalStandardScore: total,
            finalScore,
            isQualified: finalScore >= 90,
            isExemplary: existing?.isExemplary || (isPass && idx === 0),
            hasViolation: !isPass,
            violationDetails: isPass ? undefined : 'Chưa đạt đủ tiêu chuẩn nếp sống văn hóa cơ sở',
            evidenceFiles: existing?.evidenceFiles || [],
            evaluatedByLevel: evalLevel,
            updatedAt: nowStr,
          };
          if (existingIdx >= 0) {
            updated[existingIdx] = scoreObj;
          } else {
            updated.push(scoreObj);
          }
        } else {
          // pass_90 | pass_95 | pass_100
          const targetTotal = inputs.mode === 'pass_100' ? 100 : inputs.mode === 'pass_95' ? 95 : 90;
          const bonus = 0;
          const criteriaScores = distributeByTotal(targetTotal);
          const total = Object.values(criteriaScores).reduce((sum, v) => sum + (v || 0), 0);
          const finalScore = Math.min(100, total + bonus);

          const scoreObj: EvaluationScoreItem = {
            id: existing?.id || `sc-hh-${hhId}-${inputs.periodId}`,
            periodId: inputs.periodId,
            targetType: 'household',
            targetId: hhId,
            targetName: hhName,
            unitId: hhUnitId,
            unitName: hhUnitName,
            criteriaScores,
            bonusPoints: bonus,
            penaltyPoints: 0,
            totalStandardScore: total,
            finalScore,
            isQualified: true,
            isExemplary: existing?.isExemplary || (inputs.mode === 'pass_100'),
            hasViolation: false,
            violationDetails: undefined,
            evidenceFiles: existing?.evidenceFiles || [],
            returnStatus: existing?.returnStatus === 'returned_for_revision' ? 'revised' : (existing?.returnStatus || 'none'),
            revisedAt: existing?.returnStatus === 'returned_for_revision' ? nowStr : existing?.revisedAt,
            evaluatedByLevel: evalLevel,
            updatedAt: nowStr,
          };
          if (existingIdx >= 0) {
            updated[existingIdx] = scoreObj;
          } else {
            updated.push(scoreObj);
          }
        }
      });

      return updated;
    });

    let msg = `Đã áp dụng chấm nhanh cho ${inputs.householdIds.length} hộ gia đình!`;
    if (inputs.mode === 'pass_90') msg = `Đã chấm đạt chuẩn 90 điểm thành công cho ${inputs.householdIds.length} hộ!`;
    else if (inputs.mode === 'pass_95') msg = `Đã chấm đạt loại Tốt 95 điểm thành công cho ${inputs.householdIds.length} hộ!`;
    else if (inputs.mode === 'ratio_90') msg = `Đã phân bổ đạt tỷ lệ 90% cho ${inputs.householdIds.length} hộ thành công!`;
    else if (inputs.mode === 'ratio_95') msg = `Đã phân bổ đạt tỷ lệ 95% cho ${inputs.householdIds.length} hộ thành công!`;
    else if (inputs.mode === 'set_exemplary') msg = `Đã chọn ${inputs.householdIds.length} hộ gia đình Văn hóa Tiêu biểu!`;

    return {
      success: true,
      message: msg,
      count: inputs.householdIds.length,
    };
  };

  // Chọn / bỏ chọn Gia đình văn hóa tiêu biểu
  const toggleExemplaryHousehold = (householdId: string, periodId: string): { success: boolean; isExemplary: boolean } => {
    let nowExemplary = false;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setScores((prev) => {
      const idx = prev.findIndex((s) => s.periodId === periodId && s.targetType === 'household' && s.targetId === householdId);
      if (idx >= 0) {
        nowExemplary = !prev[idx].isExemplary;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          isExemplary: nowExemplary,
          updatedAt: nowStr,
        };
        return next;
      }
      return prev;
    });
    return { success: true, isExemplary: nowExemplary };
  };

  // Đính kèm file Quyết định công nhận của UBND Xã/Phường
  const updatePeriodDecisionFile = (
    periodId: string,
    data: {
      decisionNumber: string;
      decisionDate: string;
      decisionSigner: string;
      decisionFile?: EvidenceFile;
      isFinalized?: boolean;
    }
  ): { success: boolean; message: string } => {
    setAllPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              ...data,
              isFinalized: data.isFinalized ?? true,
            }
          : p
      )
    );
    return { success: true, message: 'Đã cập nhật Quyết định công nhận của UBND Xã/Phường thành công!' };
  };

  // Quản lý file báo cáo liên quan của Thôn/Tổ
  const updateUnitReportFiles = (
    unitId: string,
    periodId: string,
    reportFiles: EvidenceFile[]
  ): { success: boolean; message: string } => {
    setProgressList((prev) => {
      const idx = prev.findIndex((p) => p.unitId === unitId && p.periodId === periodId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], reportFiles };
        return next;
      }
      return [
        ...prev,
        {
          unitId,
          periodId,
          status: 'chua_gui',
          reportFiles,
        },
      ];
    });

    setAllUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, reportFiles } : u))
    );

    return { success: true, message: 'Đã lưu các file báo cáo liên quan của Thôn/Tổ thành công!' };
  };

  // Thêm file minh chứng cho hộ gia đình
  const addEvidenceToHousehold = (
    householdId: string,
    periodId: string,
    evidenceFile: EvidenceFile,
    violationDetails?: string
  ): { success: boolean; message: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setScores((prev) => {
      const idx = prev.findIndex((s) => s.periodId === periodId && s.targetType === 'household' && s.targetId === householdId);
      if (idx >= 0) {
        const currentFiles = prev[idx].evidenceFiles || [];
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          hasViolation: true,
          isQualified: false,
          violationDetails: violationDetails || next[idx].violationDetails || 'Có minh chứng vi phạm / không đạt',
          evidenceFiles: [...currentFiles, evidenceFile],
          updatedAt: nowStr,
        };
        return next;
      }
      return prev;
    });
    return { success: true, message: 'Đã tải lên tệp minh chứng cho hộ gia đình thành công!' };
  };

  // Master Data CRUD
  const addCriterion = (item: Omit<CriterionItem, 'id'>) => {
    const newItem: CriterionItem = { ...item, id: `crit-${Date.now()}` };
    setCriteria((prev) => [...prev, newItem]);
  };
  const updateCriterion = (id: string, item: Partial<CriterionItem>) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...item } : c)));
  };
  const deleteCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };
  const resetCriteria = () => {
    setCriteria([]);
  };

  // Nhóm các tiêu chí con theo standardKey và cộng dồn điểm tối đa, đúng theo targetType + vùng miền
  const getScoringStandards = (
    targetType: 'household' | 'unit' | 'clan',
    regionType?: 'dong_bang' | 'mien_nui'
  ): ScoringStandardDef[] => {
    const effectiveRegion = regionType || 'dong_bang';
    const matching = criteria.filter(
      (c) =>
        (c.targetType === targetType || c.targetType === 'all') &&
        c.regionType === effectiveRegion
    );
    // Không có bộ tiêu chí riêng theo vùng (VD: dòng họ) -> dùng bộ tiêu chí chung (không gắn vùng miền)
    const source = matching.length > 0 ? matching : criteria.filter(
      (c) => (c.targetType === targetType || c.targetType === 'all') && !c.regionType
    );

    const groups = new Map<StandardKey, CriterionItem[]>();
    source.forEach((item) => {
      const list = groups.get(item.standardKey) || [];
      list.push(item);
      groups.set(item.standardKey, list);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => ({
        key,
        label: STANDARD_LABELS[targetType]?.[key] || key,
        maxPoints: items.reduce((sum, i) => sum + i.maxPoints, 0),
        items: [...items].sort((a, b) => a.order - b.order),
      }));
  };

  const addBonusCategory = (item: Omit<BonusCategory, 'id'>) => {
    const newItem: BonusCategory = { ...item, id: `bonus-${Date.now()}` };
    setBonusCategories((prev) => [...prev, newItem]);
  };
  const updateBonusCategory = (id: string, item: Partial<BonusCategory>) => {
    setBonusCategories((prev) => prev.map((b) => (b.id === id ? { ...b, ...item } : b)));
  };
  const deleteBonusCategory = (id: string) => {
    setBonusCategories((prev) => prev.filter((b) => b.id !== id));
  };
  const resetBonusCategories = () => {
    setBonusCategories([]);
  };

  const addPenaltyCategory = (item: Omit<PenaltyCategory, 'id'>) => {
    const newItem: PenaltyCategory = { ...item, id: `penalty-${Date.now()}` };
    setPenaltyCategories((prev) => [...prev, newItem]);
  };
  const updatePenaltyCategory = (id: string, item: Partial<PenaltyCategory>) => {
    setPenaltyCategories((prev) => prev.map((p) => (p.id === id ? { ...p, ...item } : p)));
  };
  const deletePenaltyCategory = (id: string) => {
    setPenaltyCategories((prev) => prev.filter((p) => p.id !== id));
  };
  const resetPenaltyCategories = () => {
    setPenaltyCategories([]);
  };

  const addTitleCategory = (item: Omit<TitleCategory, 'id'>) => {
    const newItem: TitleCategory = { ...item, id: `title-${Date.now()}` };
    setTitleCategories((prev) => [...prev, newItem]);
  };
  const updateTitleCategory = (id: string, item: Partial<TitleCategory>) => {
    setTitleCategories((prev) => prev.map((t) => (t.id === id ? { ...t, ...item } : t)));
  };
  const deleteTitleCategory = (id: string) => {
    setTitleCategories((prev) => prev.filter((t) => t.id !== id));
  };
  const resetTitleCategories = () => {
    setTitleCategories([]);
  };

  const addHouseholdType = (item: Omit<HouseholdTypeCategory, 'id'>) => {
    const newItem: HouseholdTypeCategory = { ...item, id: `hhtype-${Date.now()}` };
    setHouseholdTypes((prev) => [...prev, newItem]);
  };
  const updateHouseholdType = (id: string, item: Partial<HouseholdTypeCategory>) => {
    setHouseholdTypes((prev) => prev.map((h) => (h.id === id ? { ...h, ...item } : h)));
  };
  const deleteHouseholdType = (id: string) => {
    setHouseholdTypes((prev) => prev.filter((h) => h.id !== id));
  };
  const resetHouseholdTypes = () => {
    setHouseholdTypes([]);
  };

  const resetAllData = () => {
    setCommunes([]);
    setSelectedCommuneIdState('');
    setCurrentUser(null);
    setUsers([]);
    setAllUnits([]);
    setAllClans([]);
    setAllHouseholds([]);
    setAllPeriods([]);
    setSelectedPeriodId('');
    setProgressList([]);
    setScores([]);
    setCriteria([]);
    setBonusCategories([]);
    setPenaltyCategories([]);
    setTitleCategories([]);
    setHouseholdTypes([]);
  };

  return (
    <AppContext.Provider
      value={{
        communes,
        selectedCommuneId,
        selectedCommune,
        terms,
        setSelectedCommuneId,
        addCommune,
        updateCommune,
        deleteCommune,
        currentUser,
        users,
        units,
        allUnits,
        clans,
        allClans,
        households,
        allHouseholds,
        periods,
        allPeriods,
        selectedPeriodId,
        selectedPeriod,
        progressList,
        scores,
        criteria,
        bonusCategories,
        penaltyCategories,
        titleCategories,
        householdTypes,
        getScoringStandards,
        addCriterion,
        updateCriterion,
        deleteCriterion,
        resetCriteria,
        addBonusCategory,
        updateBonusCategory,
        deleteBonusCategory,
        resetBonusCategories,
        addPenaltyCategory,
        updatePenaltyCategory,
        deletePenaltyCategory,
        resetPenaltyCategories,
        addTitleCategory,
        updateTitleCategory,
        deleteTitleCategory,
        resetTitleCategories,
        addHouseholdType,
        updateHouseholdType,
        deleteHouseholdType,
        resetHouseholdTypes,
        login,
        changePassword,
        resetUserPassword,
        switchUser,
        logout,
        setSelectedPeriodId,
        addUnit,
        updateUnit,
        deleteUnit,
        importUnits,
        addClan,
        updateClan,
        deleteClan,
        importClans,
        updateClanCulturalRecognition,
        addHousehold,
        updateHousehold,
        deleteHousehold,
        importHouseholds,
        addUser,
        updateUser,
        deleteUser,
        addPeriod,
        updatePeriod,
        deletePeriod,
        saveScore,
        submitUnitDataToXa,
        recallUnitSubmission,
        approveAndLockUnit,
        quickPassUnit,
        returnUnitSubmission,
        returnHouseholdScore,
        batchScoreHouseholds,
        toggleExemplaryHousehold,
        updatePeriodDecisionFile,
        updateUnitReportFiles,
        addEvidenceToHousehold,
        getUnitProgress,
        isPeriodExpired,
        canEditUnitScores,
        canEditHouseholdScore,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
