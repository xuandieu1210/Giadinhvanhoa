import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_CLANS,
  INITIAL_COMMUNES,
  INITIAL_HOUSEHOLDS,
  INITIAL_PERIODS,
  INITIAL_PROGRESS,
  INITIAL_SCORES,
  INITIAL_UNITS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  INITIAL_BONUS_CATEGORIES,
  INITIAL_CRITERIA,
  INITIAL_HOUSEHOLD_TYPES,
  INITIAL_PENALTY_CATEGORIES,
  INITIAL_TITLE_CATEGORIES,
} from '../data/categoryData';
import {
  BonusCategory,
  Clan,
  ClanCulturalStatus,
  Commune,
  CriterionItem,
  EvaluationPeriod,
  EvaluationScoreItem,
  EvidenceFile,
  Household,
  HouseholdTypeCategory,
  PenaltyCategory,
  TitleCategory,
  Unit,
  UnitPeriodProgress,
  UnitSubmissionStatus,
  User,
} from '../types';

export interface SaveScoreInput {
  id?: string;
  periodId: string;
  targetType: 'household' | 'unit' | 'clan';
  targetId: string;
  targetName: string;
  unitId: string;
  unitName: string;
  criteriaScores: {
    standard1: number;
    standard2: number;
    standard3: number;
    standard4: number;
  };
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

interface AppContextType {
  // Commune selection & multi-tenant
  communes: Commune[];
  selectedCommuneId: string;
  selectedCommune: Commune | undefined;
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
  login: (username: string, pass: string) => { success: boolean; message?: string };
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
  importHouseholds: (newHhs: (Omit<Household, 'id' | 'communeId'> & { communeId?: string })[]) => void;

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
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation';
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
  recallUnitSubmission: (unitId: string, periodId: string) => { success: boolean; message: string };
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMMUNES: 'bxvh_communes',
  SELECTED_COMMUNE: 'bxvh_selected_commune',
  CURRENT_USER: 'bxvh_current_user',
  USERS: 'bxvh_users',
  UNITS: 'bxvh_units',
  CLANS: 'bxvh_clans',
  HOUSEHOLDS: 'bxvh_households',
  PERIODS: 'bxvh_periods',
  SELECTED_PERIOD: 'bxvh_selected_period',
  PROGRESS: 'bxvh_progress',
  SCORES: 'bxvh_scores',
  CRITERIA: 'bxvh_criteria',
  BONUS_CATEGORIES: 'bxvh_bonus_categories',
  PENALTY_CATEGORIES: 'bxvh_penalty_categories',
  TITLE_CATEGORIES: 'bxvh_title_categories',
  HOUSEHOLD_TYPES: 'bxvh_household_types',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Communes (Xã / Phường)
  const [communes, setCommunes] = useState<Commune[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMUNES);
    return saved ? JSON.parse(saved) : INITIAL_COMMUNES;
  });

  const [selectedCommuneId, setSelectedCommuneIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_COMMUNE);
    return saved || 'commune-1';
  });

  // Users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) return JSON.parse(saved);
    return INITIAL_USERS[0];
  });

  // All Units
  const [allUnits, setAllUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  // All Clans
  const [allClans, setAllClans] = useState<Clan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLANS);
    return saved ? JSON.parse(saved) : INITIAL_CLANS;
  });

  // All Households
  const [allHouseholds, setAllHouseholds] = useState<Household[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS);
    return saved ? JSON.parse(saved) : INITIAL_HOUSEHOLDS;
  });

  // All Periods (Xã/phường tự tạo)
  const [allPeriods, setAllPeriods] = useState<EvaluationPeriod[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERIODS);
    return saved ? JSON.parse(saved) : INITIAL_PERIODS;
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PERIOD);
    return saved || 'period-hk-2026';
  });

  const [progressList, setProgressList] = useState<UnitPeriodProgress[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  const [scores, setScores] = useState<EvaluationScoreItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCORES);
    return saved ? JSON.parse(saved) : INITIAL_SCORES;
  });

  // Master Data Catalogs
  const [criteria, setCriteria] = useState<CriterionItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    return saved ? JSON.parse(saved) : INITIAL_CRITERIA;
  });

  const [bonusCategories, setBonusCategories] = useState<BonusCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BONUS_CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_BONUS_CATEGORIES;
  });

  const [penaltyCategories, setPenaltyCategories] = useState<PenaltyCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PENALTY_CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_PENALTY_CATEGORIES;
  });

  const [titleCategories, setTitleCategories] = useState<TitleCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TITLE_CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_TITLE_CATEGORIES;
  });

  const [householdTypes, setHouseholdTypes] = useState<HouseholdTypeCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOUSEHOLD_TYPES);
    return saved ? JSON.parse(saved) : INITIAL_HOUSEHOLD_TYPES;
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMUNES, JSON.stringify(communes));
  }, [communes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_COMMUNE, selectedCommuneId);
  }, [selectedCommuneId]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(allUnits));
  }, [allUnits]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLANS, JSON.stringify(allClans));
  }, [allClans]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(allHouseholds));
  }, [allHouseholds]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(allPeriods));
  }, [allPeriods]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PERIOD, selectedPeriodId);
  }, [selectedPeriodId]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressList));
  }, [progressList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  }, [scores]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(criteria));
  }, [criteria]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BONUS_CATEGORIES, JSON.stringify(bonusCategories));
  }, [bonusCategories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PENALTY_CATEGORIES, JSON.stringify(penaltyCategories));
  }, [penaltyCategories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TITLE_CATEGORIES, JSON.stringify(titleCategories));
  }, [titleCategories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLD_TYPES, JSON.stringify(householdTypes));
  }, [householdTypes]);

  // Active Commune
  const selectedCommune = communes.find((c) => c.id === selectedCommuneId) || communes[0];

  // Scoped Data by Selected Commune
  const units = allUnits.filter((u) => u.communeId === selectedCommuneId);
  const clans = allClans.filter((c) => c.communeId === selectedCommuneId);
  const households = allHouseholds.filter(
    (h) => h.communeId === selectedCommuneId || (!h.communeId && units.some((u) => u.id === h.unitId))
  );
  const periods = allPeriods.filter((p) => p.communeId === selectedCommuneId);

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

  // Auth handlers
  const login = (username: string, pass: string): { success: boolean; message?: string } => {
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, message: 'Tên đăng nhập không tồn tại!' };
    }

    const valid =
      (user.username === 'admin' && pass === 'admin123') ||
      (user.username === 'xa' && pass === 'xa123') ||
      (user.username === 'to1' && pass === 'to123') ||
      (user.username === 'to2' && pass === 'to2123') ||
      pass === '123456';

    if (!valid) {
      return { success: false, message: 'Mật khẩu không chính xác! (Mặc định: [tài khoản]123)' };
    }

    setCurrentUser(user);
    if (user.communeId) {
      setSelectedCommuneId(user.communeId);
    }
    return { success: true };
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
    const newUnit: Unit = {
      ...unit,
      id: `unit-${Date.now()}`,
      communeId: unit.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
    };
    setAllUnits((prev) => [...prev, newUnit]);
  };

  const updateUnit = (id: string, updated: Partial<Unit>) => {
    setAllUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
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
    const created: Unit[] = newUnits.map((u, i) => ({
      ...u,
      id: `unit-${Date.now()}-${i}`,
      communeId: u.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
    }));
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

  const importHouseholds = (newHhs: (Omit<Household, 'id' | 'communeId'> & { communeId?: string })[]) => {
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
    setAllHouseholds((prev) => [...prev, ...created]);
  };

  // User CRUD
  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      communeId: user.communeId || selectedCommuneId,
      communeName: selectedCommune?.name || '',
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
    const check = canEditUnitScores(scoreData.unitId, scoreData.periodId);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Không được phép chỉnh sửa điểm.' };
    }

    const totalStandardScore =
      (scoreData.criteriaScores.standard1 || 0) +
      (scoreData.criteriaScores.standard2 || 0) +
      (scoreData.criteriaScores.standard3 || 0) +
      (scoreData.criteriaScores.standard4 || 0);

    const bonus = scoreData.bonusPoints || 0;
    const penalty = scoreData.penaltyPoints || 0;
    const finalScore = Math.max(0, Math.min(100, totalStandardScore + bonus - penalty));
    const isQualified = finalScore >= 90;

    const evalLevel = currentUser?.role === 'to_truong' ? 'to' : 'xa';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const existingIndex = scores.findIndex(
      (s) =>
        s.periodId === scoreData.periodId &&
        s.targetType === scoreData.targetType &&
        s.targetId === scoreData.targetId
    );

    const existing = existingIndex >= 0 ? scores[existingIndex] : undefined;

    const completeScore: EvaluationScoreItem = {
      id: scoreData.id || existing?.id || `sc-${Date.now()}`,
      periodId: scoreData.periodId,
      targetType: scoreData.targetType,
      targetId: scoreData.targetId,
      targetName: scoreData.targetName,
      unitId: scoreData.unitId,
      unitName: scoreData.unitName,
      criteriaScores: scoreData.criteriaScores,
      bonusPoints: bonus,
      penaltyPoints: penalty,
      totalStandardScore,
      finalScore,
      isQualified,
      isExemplary: scoreData.isExemplary ?? existing?.isExemplary ?? false,
      hasViolation: scoreData.hasViolation ?? existing?.hasViolation ?? (penalty > 0 || !isQualified),
      violationDetails: scoreData.violationDetails ?? existing?.violationDetails,
      evidenceFiles: scoreData.evidenceFiles ?? existing?.evidenceFiles ?? [],
      returnStatus: scoreData.returnStatus ?? existing?.returnStatus ?? 'none',
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

    return { success: true, message: 'Đã lưu điểm đánh giá thành công!' };
  };

  // Submit Unit Data to Commune
  const submitUnitDataToXa = (unitId: string, periodId: string, notes?: string): { success: boolean; message: string } => {
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

    const newScores: EvaluationScoreItem[] = [];

    // Tự chấm điểm Thôn/Tổ
    newScores.push({
      id: `sc-unit-${unitId}-${periodId}`,
      periodId,
      targetType: 'unit',
      targetId: unitId,
      targetName: unitName,
      unitId,
      unitName,
      criteriaScores: { standard1: 29, standard2: 29, standard3: 28, standard4: 9 },
      bonusPoints: 1,
      penaltyPoints: 0,
      totalStandardScore: 95,
      finalScore: 96,
      isQualified: true,
      evaluatedByLevel: currentUser?.role === 'to_truong' ? 'to' : 'xa',
      comments: 'Tự chấm đạt chuẩn văn hóa cấp tổ/thôn.',
      updatedAt: nowStr,
    });

    // Chấm các Hộ gia đình trong thôn/tổ
    targetHhs.forEach((hh, i) => {
      const s1 = 28 + (i % 3);
      const s2 = 28 + ((i + 1) % 3);
      const s3 = 27 + (i % 4);
      const s4 = 9;
      const total = s1 + s2 + s3 + s4;
      const bonus = (i % 2 === 0) ? 1 : 0;
      const final = total + bonus;
      newScores.push({
        id: `sc-hh-${hh.id}-${periodId}`,
        periodId,
        targetType: 'household',
        targetId: hh.id,
        targetName: `Hộ ${hh.headName}`,
        unitId,
        unitName,
        criteriaScores: { standard1: s1, standard2: s2, standard3: s3, standard4: s4 },
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
    return { success: true, message: 'Đã đánh dấu yêu cầu Tổ chấm lại hộ này thành công!' };
  };

  // Chấm nhanh nhiều hộ 1 lúc (Batch scoring)
  const batchScoreHouseholds = (inputs: {
    householdIds: string[];
    periodId: string;
    unitId: string;
    unitName: string;
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation';
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }): { success: boolean; message: string; count: number } => {
    const check = canEditUnitScores(inputs.unitId, inputs.periodId);
    if (!check.allowed) {
      return { success: false, message: check.reason || 'Không được phép chỉnh sửa điểm của đơn vị này.', count: 0 };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const evalLevel = currentUser?.role === 'to_truong' ? 'to' : 'xa';

    setScores((prev) => {
      const updated = [...prev];

      inputs.householdIds.forEach((hhId) => {
        const hhObj = allHouseholds.find((h) => h.id === hhId);
        const hhName = hhObj ? `Hộ ${hhObj.headName}` : 'Hộ gia đình';
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
            updated.push({
              id: `sc-hh-${hhId}-${inputs.periodId}`,
              periodId: inputs.periodId,
              targetType: 'household',
              targetId: hhId,
              targetName: hhName,
              unitId: inputs.unitId,
              unitName: inputs.unitName,
              criteriaScores: { standard1: 29, standard2: 29, standard3: 29, standard4: 9 },
              bonusPoints: 1,
              penaltyPoints: 0,
              totalStandardScore: 96,
              finalScore: 97,
              isQualified: true,
              isExemplary,
              evaluatedByLevel: evalLevel,
              updatedAt: nowStr,
            });
          }
        } else if (inputs.mode === 'violation') {
          const penalty = 15;
          const s1 = 20;
          const s2 = 25;
          const s3 = 20;
          const s4 = 5;
          const total = s1 + s2 + s3 + s4;
          const finalScore = Math.max(0, total - penalty);
          const scoreObj: EvaluationScoreItem = {
            id: existing?.id || `sc-hh-${hhId}-${inputs.periodId}`,
            periodId: inputs.periodId,
            targetType: 'household',
            targetId: hhId,
            targetName: hhName,
            unitId: inputs.unitId,
            unitName: inputs.unitName,
            criteriaScores: { standard1: s1, standard2: s2, standard3: s3, standard4: s4 },
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
        } else {
          let s1 = 28;
          let s2 = 28;
          let s3 = 27;
          let s4 = 8;
          let bonus = 0;
          if (inputs.mode === 'pass_95') {
            s1 = 29; s2 = 29; s3 = 28; s4 = 9; bonus = 0;
          } else if (inputs.mode === 'pass_100') {
            s1 = 30; s2 = 30; s3 = 30; s4 = 10; bonus = 0;
          }
          const total = s1 + s2 + s3 + s4;
          const finalScore = total + bonus;

          const scoreObj: EvaluationScoreItem = {
            id: existing?.id || `sc-hh-${hhId}-${inputs.periodId}`,
            periodId: inputs.periodId,
            targetType: 'household',
            targetId: hhId,
            targetName: hhName,
            unitId: inputs.unitId,
            unitName: inputs.unitName,
            criteriaScores: { standard1: s1, standard2: s2, standard3: s3, standard4: s4 },
            bonusPoints: bonus,
            penaltyPoints: 0,
            totalStandardScore: total,
            finalScore,
            isQualified: true,
            isExemplary: existing?.isExemplary || (inputs.mode === 'pass_100'),
            hasViolation: false,
            violationDetails: undefined,
            evidenceFiles: existing?.evidenceFiles || [],
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

    return {
      success: true,
      message: `Đã áp dụng chấm nhanh cho ${inputs.householdIds.length} hộ gia đình!`,
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
    setCriteria(INITIAL_CRITERIA);
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
    setBonusCategories(INITIAL_BONUS_CATEGORIES);
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
    setPenaltyCategories(INITIAL_PENALTY_CATEGORIES);
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
    setTitleCategories(INITIAL_TITLE_CATEGORIES);
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
    setHouseholdTypes(INITIAL_HOUSEHOLD_TYPES);
  };

  const resetAllData = () => {
    localStorage.clear();
    setCommunes(INITIAL_COMMUNES);
    setSelectedCommuneIdState('commune-1');
    setCurrentUser(INITIAL_USERS[0]);
    setUsers(INITIAL_USERS);
    setAllUnits(INITIAL_UNITS);
    setAllClans(INITIAL_CLANS);
    setAllHouseholds(INITIAL_HOUSEHOLDS);
    setAllPeriods(INITIAL_PERIODS);
    setSelectedPeriodId('period-hk-2026');
    setProgressList(INITIAL_PROGRESS);
    setScores(INITIAL_SCORES);
    setCriteria(INITIAL_CRITERIA);
    setBonusCategories(INITIAL_BONUS_CATEGORIES);
    setPenaltyCategories(INITIAL_PENALTY_CATEGORIES);
    setTitleCategories(INITIAL_TITLE_CATEGORIES);
    setHouseholdTypes(INITIAL_HOUSEHOLD_TYPES);
  };

  return (
    <AppContext.Provider
      value={{
        communes,
        selectedCommuneId,
        selectedCommune,
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
