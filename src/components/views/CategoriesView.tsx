import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FolderTree,
  Home,
  Info,
  Layers,
  ListPlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Users2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BonusCategory,
  CriterionItem,
  HouseholdTypeCategory,
  PenaltyCategory,
  TitleCategory,
} from '../../types';

export type CategorySubTab =
  | 'criteria'
  | 'bonus'
  | 'penalty'
  | 'titles'
  | 'householdTypes';

interface CategoriesViewProps {
  initialSubTab?: CategorySubTab;
  onNavigateToTab?: (tabKey: any) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  initialSubTab = 'criteria',
  onNavigateToTab,
}) => {
  const {
    currentUser,
    criteria,
    bonusCategories,
    penaltyCategories,
    titleCategories,
    householdTypes,
    units,
    clans,
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
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<CategorySubTab>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStandard, setFilterStandard] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<string>('all');

  // Modal states
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionItem | null>(null);

  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<BonusCategory | null>(null);

  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<PenaltyCategory | null>(null);

  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<TitleCategory | null>(null);

  const [isHouseholdTypeModalOpen, setIsHouseholdTypeModalOpen] = useState(false);
  const [editingHouseholdType, setEditingHouseholdType] = useState<HouseholdTypeCategory | null>(null);

  const isAdminOrXa = currentUser?.role === 'admin' || currentUser?.role === 'can_bo_xa';

  // Standards map
  const standardNames: Record<string, { title: string; maxPoints: number; badgeColor: string }> = {
    standard1: {
      title: 'Tiêu chuẩn 1: Gương mẫu chấp hành chủ trương, pháp luật',
      maxPoints: 30,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    standard2: {
      title: 'Tiêu chuẩn 2: Phát triển kinh tế, nỗ lực làm giàu',
      maxPoints: 30,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    standard3: {
      title: 'Tiêu chuẩn 3: Nếp sống văn hóa, gia đình hòa thuận',
      maxPoints: 30,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    standard4: {
      title: 'Tiêu chuẩn 4: Môi trường, cảnh quan, an ninh trật tự',
      maxPoints: 10,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  };

  // --- Handlers for Criteria ---
  const handleOpenCriterionModal = (item?: CriterionItem) => {
    setEditingCriterion(item || null);
    setIsCriterionModalOpen(true);
  };

  const handleSaveCriterion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const standardKey = formData.get('standardKey') as 'standard1' | 'standard2' | 'standard3' | 'standard4';
    const code = (formData.get('code') as string).trim();
    const name = (formData.get('name') as string).trim();
    const maxPoints = Number(formData.get('maxPoints')) || 10;
    const targetType = formData.get('targetType') as 'all' | 'household' | 'unit' | 'clan';
    const description = (formData.get('description') as string).trim();
    const order = Number(formData.get('order')) || 1;

    if (!code || !name) {
      alert('Vui lòng nhập đầy đủ mã và tên tiêu chí!');
      return;
    }

    if (editingCriterion) {
      updateCriterion(editingCriterion.id, {
        standardKey,
        code,
        name,
        maxPoints,
        targetType,
        description,
        order,
      });
    } else {
      addCriterion({
        standardKey,
        code,
        name,
        maxPoints,
        targetType,
        description,
        order,
      });
    }

    setIsCriterionModalOpen(false);
  };

  // --- Handlers for Bonus Categories ---
  const handleOpenBonusModal = (item?: BonusCategory) => {
    setEditingBonus(item || null);
    setIsBonusModalOpen(true);
  };

  const handleSaveBonus = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const code = (formData.get('code') as string).trim();
    const title = (formData.get('title') as string).trim();
    const points = Number(formData.get('points')) || 1;
    const applicableTarget = formData.get('applicableTarget') as 'all' | 'household' | 'unit' | 'clan';
    const categoryGroup = (formData.get('categoryGroup') as string).trim();
    const description = (formData.get('description') as string).trim();

    if (!code || !title) {
      alert('Vui lòng nhập đầy đủ mã và tên mục điểm cộng!');
      return;
    }

    if (editingBonus) {
      updateBonusCategory(editingBonus.id, {
        code,
        title,
        points,
        applicableTarget,
        categoryGroup,
        description,
      });
    } else {
      addBonusCategory({
        code,
        title,
        points,
        applicableTarget,
        categoryGroup,
        description,
      });
    }

    setIsBonusModalOpen(false);
  };

  // --- Handlers for Penalty Categories ---
  const handleOpenPenaltyModal = (item?: PenaltyCategory) => {
    setEditingPenalty(item || null);
    setIsPenaltyModalOpen(true);
  };

  const handleSavePenalty = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const code = (formData.get('code') as string).trim();
    const title = (formData.get('title') as string).trim();
    const points = Number(formData.get('points')) || 2;
    const applicableTarget = formData.get('applicableTarget') as 'all' | 'household' | 'unit' | 'clan';
    const categoryGroup = (formData.get('categoryGroup') as string).trim();
    const severity = formData.get('severity') as 'Nhẹ' | 'Nghiêm trọng' | 'Rất nghiêm trọng';
    const description = (formData.get('description') as string).trim();

    if (!code || !title) {
      alert('Vui lòng nhập đầy đủ mã và hành vi vi phạm!');
      return;
    }

    if (editingPenalty) {
      updatePenaltyCategory(editingPenalty.id, {
        code,
        title,
        points,
        applicableTarget,
        categoryGroup,
        severity,
        description,
      });
    } else {
      addPenaltyCategory({
        code,
        title,
        points,
        applicableTarget,
        categoryGroup,
        severity,
        description,
      });
    }

    setIsPenaltyModalOpen(false);
  };

  // --- Handlers for Cultural Titles ---
  const handleOpenTitleModal = (item?: TitleCategory) => {
    setEditingTitle(item || null);
    setIsTitleModalOpen(true);
  };

  const handleSaveTitle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const code = (formData.get('code') as string).trim();
    const name = (formData.get('name') as string).trim();
    const targetType = formData.get('targetType') as 'household' | 'unit' | 'clan';
    const minScore = Number(formData.get('minScore')) || 90;
    const quotaVal = formData.get('quotaPercent') as string;
    const quotaPercent = quotaVal ? Number(quotaVal) : undefined;
    const isExemplary = formData.get('isExemplary') === 'true';
    const legalDoc = (formData.get('legalDoc') as string).trim();
    const description = (formData.get('description') as string).trim();

    if (!code || !name) {
      alert('Vui lòng nhập đầy đủ mã và tên danh hiệu!');
      return;
    }

    if (editingTitle) {
      updateTitleCategory(editingTitle.id, {
        code,
        name,
        targetType,
        minScore,
        quotaPercent,
        isExemplary,
        legalDoc,
        description,
      });
    } else {
      addTitleCategory({
        code,
        name,
        targetType,
        minScore,
        quotaPercent,
        isExemplary,
        legalDoc,
        description,
      });
    }

    setIsTitleModalOpen(false);
  };

  // --- Handlers for Household Types ---
  const handleOpenHouseholdTypeModal = (item?: HouseholdTypeCategory) => {
    setEditingHouseholdType(item || null);
    setIsHouseholdTypeModalOpen(true);
  };

  const handleSaveHouseholdType = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const code = (formData.get('code') as string).trim();
    const name = (formData.get('name') as string).trim();
    const description = (formData.get('description') as string).trim();
    const color = (formData.get('color') as string).trim() || 'border-slate-500 bg-slate-50 text-slate-700';

    if (!code || !name) {
      alert('Vui lòng nhập đầy đủ mã và tên phân loại hộ!');
      return;
    }

    if (editingHouseholdType) {
      updateHouseholdType(editingHouseholdType.id, {
        code,
        name,
        description,
        color,
      });
    } else {
      addHouseholdType({
        code,
        name,
        description,
        color,
      });
    }

    setIsHouseholdTypeModalOpen(false);
  };

  // Filtered lists
  const filteredCriteria = criteria.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStandard = filterStandard === 'all' || c.standardKey === filterStandard;
    const matchTarget = filterTarget === 'all' || c.targetType === 'all' || c.targetType === filterTarget;
    return matchSearch && matchStandard && matchTarget;
  });

  const filteredBonus = bonusCategories.filter((b) => {
    const matchSearch =
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.categoryGroup.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTarget = filterTarget === 'all' || b.applicableTarget === 'all' || b.applicableTarget === filterTarget;
    return matchSearch && matchTarget;
  });

  const filteredPenalty = penaltyCategories.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryGroup.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTarget = filterTarget === 'all' || p.applicableTarget === 'all' || p.applicableTarget === filterTarget;
    return matchSearch && matchTarget;
  });

  const filteredTitles = titleCategories.filter((t) => {
    const matchSearch =
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.legalDoc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTarget = filterTarget === 'all' || t.targetType === filterTarget;
    return matchSearch && matchTarget;
  });

  const filteredHouseholdTypes = householdTypes.filter((h) => {
    return (
      h.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'household':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Hộ gia đình</span>;
      case 'unit':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Thôn / Tổ</span>;
      case 'clan':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Tộc họ</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">Tất cả đối tượng</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 shadow-xs">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  Quản lý Danh mục Hệ thống & Tiêu chuẩn Bình xét
                </h1>
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full">
                  NĐ 86/2023/NĐ-CP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cấu hình hệ thống danh mục chuẩn quốc gia: Tiêu chí chấm điểm, Điểm cộng khen thưởng, Điểm trừ vi phạm, Khung danh hiệu thi đua và Phân loại hộ dân.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdminOrXa && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Khôi phục toàn bộ danh mục về giá trị chuẩn mặc định theo Nghị định 86/2023/NĐ-CP?')) {
                      resetCriteria();
                      resetBonusCategories();
                      resetPenaltyCategories();
                      resetTitleCategories();
                      resetHouseholdTypes();
                      alert('Đã khôi phục toàn bộ danh mục về chuẩn mặc định!');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 cursor-pointer"
                  title="Khôi phục dữ liệu danh mục mẫu"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Khôi phục chuẩn NĐ 86</span>
                </button>

                {activeSubTab === 'criteria' && (
                  <button
                    type="button"
                    onClick={() => handleOpenCriterionModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm tiêu chí mới</span>
                  </button>
                )}

                {activeSubTab === 'bonus' && (
                  <button
                    type="button"
                    onClick={() => handleOpenBonusModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm mục điểm cộng</span>
                  </button>
                )}

                {activeSubTab === 'penalty' && (
                  <button
                    type="button"
                    onClick={() => handleOpenPenaltyModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm mục điểm trừ</span>
                  </button>
                )}

                {activeSubTab === 'titles' && (
                  <button
                    type="button"
                    onClick={() => handleOpenTitleModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm danh hiệu thi đua</span>
                  </button>
                )}

                {activeSubTab === 'householdTypes' && (
                  <button
                    type="button"
                    onClick={() => handleOpenHouseholdTypeModal()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm phân loại hộ</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveSubTab('criteria')}
            className={`p-3 rounded-lg text-left transition border ${
              activeSubTab === 'criteria'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-red-600" />
              Tiêu chí bình xét
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {criteria.length} <span className="text-xs font-normal text-slate-500">mục</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('bonus')}
            className={`p-3 rounded-lg text-left transition border ${
              activeSubTab === 'bonus'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Điểm cộng / Thưởng
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {bonusCategories.length} <span className="text-xs font-normal text-slate-500">quy tắc</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('penalty')}
            className={`p-3 rounded-lg text-left transition border ${
              activeSubTab === 'penalty'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Điểm trừ / Vi phạm
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {penaltyCategories.length} <span className="text-xs font-normal text-slate-500">quy tắc</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('titles')}
            className={`p-3 rounded-lg text-left transition border ${
              activeSubTab === 'titles'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Danh hiệu thi đua
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {titleCategories.length} <span className="text-xs font-normal text-slate-500">danh hiệu</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSubTab('householdTypes')}
            className={`p-3 rounded-lg text-left transition border ${
              activeSubTab === 'householdTypes'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Phân loại hộ
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {householdTypes.length} <span className="text-xs font-normal text-slate-500">loại hình</span>
            </div>
          </button>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              Thôn/Tổ & Tộc họ
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center justify-between">
              <span>{units.length} Tổ • {clans.length} Tộc</span>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('units')}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  Xem
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl pt-2 overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('criteria');
            setFilterStandard('all');
            setFilterTarget('all');
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'criteria'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Bộ tiêu chí bình xét ({criteria.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('bonus');
            setFilterStandard('all');
            setFilterTarget('all');
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'bonus'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. Điểm cộng & Khen thưởng ({bonusCategories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('penalty');
            setFilterStandard('all');
            setFilterTarget('all');
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'penalty'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>3. Điểm trừ & Vi phạm ({penaltyCategories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('titles');
            setFilterStandard('all');
            setFilterTarget('all');
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'titles'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. Danh hiệu văn hóa & Thi đua ({titleCategories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('householdTypes');
            setFilterStandard('all');
            setFilterTarget('all');
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeSubTab === 'householdTypes'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>5. Phân loại Hộ gia đình ({householdTypes.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-b-xl -mt-6 border-x border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục theo mã, tên, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {activeSubTab === 'criteria' && (
            <select
              value={filterStandard}
              onChange={(e) => setFilterStandard(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="all">Tất cả 4 tiêu chuẩn</option>
              <option value="standard1">TC 1: Gương mẫu pháp luật (30đ)</option>
              <option value="standard2">TC 2: Kinh tế, làm giàu (30đ)</option>
              <option value="standard3">TC 3: Nếp sống văn hóa (30đ)</option>
              <option value="standard4">TC 4: Môi trường, an ninh (10đ)</option>
            </select>
          )}

          {activeSubTab !== 'householdTypes' && (
            <select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value="household">Hộ gia đình</option>
              <option value="unit">Thôn / Tổ dân phố</option>
              <option value="clan">Dòng họ / Tộc họ</option>
            </select>
          )}

          <div className="text-xs text-slate-400 font-medium ml-auto">
            Hiển thị kết quả phù hợp
          </div>
        </div>
      </div>

      {/* CONTENT FOR TAB 1: CRITERIA */}
      {activeSubTab === 'criteria' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Khung tiêu chuẩn theo Nghị định 86/2023/NĐ-CP:</span> Tổng điểm chuẩn tối đa là <strong>100 điểm</strong> chia đều cho 4 tiêu chuẩn chính (TC1: 30đ, TC2: 30đ, TC3: 30đ, TC4: 10đ). Ngưỡng công nhận đạt chuẩn tối thiểu là <strong>≥ 90 điểm</strong>.
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4 w-16 text-center">STT</th>
                    <th className="py-3 px-4 w-24">Mã</th>
                    <th className="py-3 px-4 w-48">Tiêu chuẩn chính</th>
                    <th className="py-3 px-4">Tên tiêu chí & Nội dung đánh giá</th>
                    <th className="py-3 px-4 w-28 text-center">Điểm tối đa</th>
                    <th className="py-3 px-4 w-32 text-center">Áp dụng</th>
                    {isAdminOrXa && <th className="py-3 px-4 w-24 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCriteria.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Không tìm thấy tiêu chí nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredCriteria.map((item, idx) => {
                      const stdInfo = standardNames[item.standardKey] || {
                        title: item.standardKey,
                        maxPoints: 0,
                        badgeColor: 'bg-slate-100 text-slate-700',
                      };
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {item.code}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${stdInfo.badgeColor}`}>
                              {item.standardKey.toUpperCase()} (Max {stdInfo.maxPoints}đ)
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {stdInfo.title}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.name}</div>
                            {item.description && (
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                              {item.maxPoints} đ
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getTargetBadge(item.targetType)}
                          </td>
                          {isAdminOrXa && (
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCriterionModal(item)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition"
                                  title="Chỉnh sửa tiêu chí"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Xóa tiêu chí "${item.code} - ${item.name}"?`)) {
                                      deleteCriterion(item.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition"
                                  title="Xóa tiêu chí"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 2: BONUS CATEGORIES */}
      {activeSubTab === 'bonus' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Danh mục Điểm cộng & Khen thưởng:</span> Dành cho các gia đình, tộc họ hoặc thôn/tổ có thành tích đặc biệt xuất sắc (Hiến đất làm đường, có công cách mạng, học sinh giỏi quốc gia, đỡ đầu hộ nghèo). Khi chấm điểm, người dùng có thể tích chọn trực tiếp từ danh mục này để hệ thống tự động cộng điểm.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBonus.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {b.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      +{b.points} điểm
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm">{b.title}</h3>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Nhóm: <span className="text-slate-700">{b.categoryGroup}</span>
                  </div>
                  {b.description && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>{getTargetBadge(b.applicableTarget)}</div>
                  {isAdminOrXa && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenBonusModal(b)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-emerald-600 transition"
                        title="Sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa mục điểm cộng "${b.title}"?`)) {
                            deleteBonusCategory(b.id);
                          }
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 3: PENALTY CATEGORIES */}
      {activeSubTab === 'penalty' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Danh mục Điểm trừ & Lỗi vi phạm:</span> Áp dụng khi hộ dân, dòng họ hoặc thôn/tổ vi phạm quy ước văn hóa, trật tự xã hội, an toàn giao thông, môi trường. Tự động khấu trừ vào điểm tổng kết và ghi nhận vào biên bản bình xét.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPenalty.map((p) => {
              const severityColor =
                p.severity === 'Rất nghiêm trọng'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : p.severity === 'Nghiêm trọng'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {p.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800">
                        -{p.points} điểm
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${severityColor}`}>
                        {p.severity}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Nhóm: {p.categoryGroup}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>{getTargetBadge(p.applicableTarget)}</div>
                    {isAdminOrXa && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPenaltyModal(p)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-rose-600 transition"
                          title="Sửa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Xóa mục điểm trừ "${p.title}"?`)) {
                              deletePenaltyCategory(p.id);
                            }
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 4: CULTURAL TITLES */}
      {activeSubTab === 'titles' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Khung danh hiệu thi đua & Tỷ lệ khen thưởng:</span> Theo Nghị định 86/2023/NĐ-CP, tỷ lệ hộ gia đình được tặng Giấy khen "Gia đình văn hóa tiêu biểu" không quá <strong>20%</strong> tổng số gia đình đạt chuẩn văn hóa tại cơ sở.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTitles.map((t) => (
              <div
                key={t.id}
                className={`bg-white p-5 rounded-xl border shadow-xs transition flex flex-col justify-between ${
                  t.isExemplary ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {t.code}
                    </span>
                    {t.isExemplary ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        Danh hiệu Tiêu biểu (Khen thưởng)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        Đạt chuẩn thông thường
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    {t.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    Căn cứ pháp lý: <span className="text-slate-700">{t.legalDoc}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Ngưỡng điểm tối thiểu:</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">≥ {t.minScore} điểm</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[11px]">Tỷ lệ khống chế bình xét:</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">
                        {t.quotaPercent ? `Tối đa ${t.quotaPercent}%` : 'Không giới hạn'}
                      </div>
                    </div>
                  </div>

                  {t.description && (
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>{getTargetBadge(t.targetType)}</div>
                  {isAdminOrXa && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenTitleModal(t)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-amber-600 transition"
                        title="Sửa"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xóa danh hiệu "${t.name}"?`)) {
                            deleteTitleCategory(t.id);
                          }
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT FOR TAB 5: HOUSEHOLD TYPES */}
      {activeSubTab === 'householdTypes' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
            <Tag className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Danh mục Phân loại Hộ gia đình / Diện quản lý:</span> Giúp phân nhóm nhân khẩu và đối tượng chính sách để phục vụ công tác thống kê, báo cáo chuyên đề và phân bổ chỉ tiêu thi đua công bằng.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHouseholdTypes.map((h) => (
              <div
                key={h.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {h.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${h.color}`}>
                      Nhãn phân loại
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm mt-1">{h.name}</h3>
                  {h.description && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {h.description}
                    </p>
                  )}
                </div>

                {isAdminOrXa && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenHouseholdTypeModal(h)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-indigo-600 transition"
                      title="Sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Xóa loại hình "${h.name}"?`)) {
                          deleteHouseholdType(h.id);
                        }
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Modal Add/Edit Criterion */}
      {isCriterionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-sm">
                  {editingCriterion ? 'Chỉnh sửa Tiêu chí Bình xét' : 'Thêm Tiêu chí Bình xét Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsCriterionModalOpen(false)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCriterion} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu chuẩn chính *
                  </label>
                  <select
                    name="standardKey"
                    defaultValue={editingCriterion?.standardKey || 'standard1'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                    required
                  >
                    <option value="standard1">Tiêu chuẩn 1 (Max 30đ)</option>
                    <option value="standard2">Tiêu chuẩn 2 (Max 30đ)</option>
                    <option value="standard3">Tiêu chuẩn 3 (Max 30đ)</option>
                    <option value="standard4">Tiêu chuẩn 4 (Max 10đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã tiêu chí *
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingCriterion?.code || `TC-${Date.now().toString().slice(-4)}`}
                    placeholder="VD: TC1.4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên tiêu chí bình xét *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCriterion?.name || ''}
                  placeholder="Nhập tên nội dung tiêu chí..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm tối đa *
                  </label>
                  <input
                    type="number"
                    name="maxPoints"
                    defaultValue={editingCriterion?.maxPoints ?? 10}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Áp dụng cho
                  </label>
                  <select
                    name="targetType"
                    defaultValue={editingCriterion?.targetType || 'all'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="all">Tất cả đối tượng</option>
                    <option value="household">Hộ gia đình</option>
                    <option value="unit">Thôn / Tổ</option>
                    <option value="clan">Dòng họ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    name="order"
                    defaultValue={editingCriterion?.order ?? criteria.length + 1}
                    min="1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết & Hướng dẫn chấm
                </label>
                <textarea
                  name="description"
                  defaultValue={editingCriterion?.description || ''}
                  rows={3}
                  placeholder="Ghi rõ tiêu chuẩn minh chứng, các hành vi đạt hoặc không đạt..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-red-500/20"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCriterionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {editingCriterion ? 'Lưu cập nhật' : 'Thêm tiêu chí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Add/Edit Bonus Category */}
      {isBonusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">
                  {editingBonus ? 'Chỉnh sửa Mục Điểm Cộng' : 'Thêm Mục Điểm Cộng / Khen Thưởng Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsBonusModalOpen(false)}
                className="p-1 hover:bg-emerald-700 rounded text-emerald-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã quy tắc *
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingBonus?.code || `DC-${Date.now().toString().slice(-4)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mức điểm cộng *
                  </label>
                  <input
                    type="number"
                    name="points"
                    defaultValue={editingBonus?.points ?? 2}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên nội dung thành tích khen thưởng *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingBonus?.title || ''}
                  placeholder="VD: Gia đình hiến đất làm đường giao thông nông thôn..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhóm thành tích
                  </label>
                  <input
                    type="text"
                    name="categoryGroup"
                    defaultValue={editingBonus?.categoryGroup || 'Khen thưởng thi đua'}
                    placeholder="VD: Khuyến học, NTM, Xã hội hóa..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Áp dụng cho
                  </label>
                  <select
                    name="applicableTarget"
                    defaultValue={editingBonus?.applicableTarget || 'all'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="all">Tất cả đối tượng</option>
                    <option value="household">Hộ gia đình</option>
                    <option value="unit">Thôn / Tổ</option>
                    <option value="clan">Dòng họ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Điều kiện áp dụng
                </label>
                <textarea
                  name="description"
                  defaultValue={editingBonus?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBonusModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {editingBonus ? 'Lưu cập nhật' : 'Thêm mục điểm cộng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Add/Edit Penalty Category */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-sm">
                  {editingPenalty ? 'Chỉnh sửa Mục Điểm Trừ' : 'Thêm Mục Điểm Trừ / Lỗi Vi Phạm'}
                </h3>
              </div>
              <button
                onClick={() => setIsPenaltyModalOpen(false)}
                className="p-1 hover:bg-rose-700 rounded text-rose-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePenalty} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã lỗi *
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingPenalty?.code || `DT-${Date.now().toString().slice(-4)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điểm trừ *
                  </label>
                  <input
                    type="number"
                    name="points"
                    defaultValue={editingPenalty?.points ?? 3}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hành vi vi phạm / Khuyết điểm *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingPenalty?.title || ''}
                  placeholder="VD: Vi phạm quy định an toàn giao thông..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mức độ vi phạm
                  </label>
                  <select
                    name="severity"
                    defaultValue={editingPenalty?.severity || 'Nhẹ'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="Nhẹ">Nhẹ</option>
                    <option value="Nghiêm trọng">Nghiêm trọng</option>
                    <option value="Rất nghiêm trọng">Rất nghiêm trọng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhóm vi phạm
                  </label>
                  <input
                    type="text"
                    name="categoryGroup"
                    defaultValue={editingPenalty?.categoryGroup || 'Trật tự an toàn'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Áp dụng cho
                  </label>
                  <select
                    name="applicableTarget"
                    defaultValue={editingPenalty?.applicableTarget || 'all'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="all">Tất cả đối tượng</option>
                    <option value="household">Hộ gia đình</option>
                    <option value="unit">Thôn / Tổ</option>
                    <option value="clan">Dòng họ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả tình tiết vi phạm
                </label>
                <textarea
                  name="description"
                  defaultValue={editingPenalty?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPenaltyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {editingPenalty ? 'Lưu cập nhật' : 'Thêm mục điểm trừ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Add/Edit Title Category */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-amber-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {editingTitle ? 'Chỉnh sửa Danh hiệu Thi đua' : 'Thêm Danh hiệu Thi đua Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsTitleModalOpen(false)}
                className="p-1 hover:bg-amber-700 rounded text-amber-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã danh hiệu *
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingTitle?.code || `DH-${Date.now().toString().slice(-4)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đối tượng xét tặng *
                  </label>
                  <select
                    name="targetType"
                    defaultValue={editingTitle?.targetType || 'household'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="household">Hộ gia đình</option>
                    <option value="unit">Thôn / Tổ dân phố</option>
                    <option value="clan">Dòng họ / Tộc họ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên danh hiệu *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTitle?.name || ''}
                  placeholder="VD: Gia đình văn hóa tiêu biểu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm sàn tối thiểu *
                  </label>
                  <input
                    type="number"
                    name="minScore"
                    defaultValue={editingTitle?.minScore ?? 90}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tỷ lệ tối đa (%)
                  </label>
                  <input
                    type="number"
                    name="quotaPercent"
                    defaultValue={editingTitle?.quotaPercent ?? ''}
                    placeholder="VD: 20"
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại danh hiệu
                  </label>
                  <select
                    name="isExemplary"
                    defaultValue={editingTitle?.isExemplary ? 'true' : 'false'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="false">Đạt chuẩn thường</option>
                    <option value="true">Tiêu biểu (Khen thưởng)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Căn cứ pháp lý
                </label>
                <input
                  type="text"
                  name="legalDoc"
                  defaultValue={editingTitle?.legalDoc || 'Nghị định số 86/2023/NĐ-CP'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Tiêu chuẩn xét tặng
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTitle?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTitleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {editingTitle ? 'Lưu cập nhật' : 'Thêm danh hiệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Add/Edit Household Type */}
      {isHouseholdTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm">
                  {editingHouseholdType ? 'Chỉnh sửa Phân loại Hộ' : 'Thêm Phân loại Hộ Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsHouseholdTypeModalOpen(false)}
                className="p-1 hover:bg-indigo-700 rounded text-indigo-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHouseholdType} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã loại hình *
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingHouseholdType?.code || `LH-${Date.now().toString().slice(-4)}`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Màu sắc nhận diện
                  </label>
                  <select
                    name="color"
                    defaultValue={editingHouseholdType?.color || 'border-blue-500 bg-blue-50 text-blue-700'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="border-red-500 bg-red-50 text-red-700">Đỏ (Chính sách, ưu tiên)</option>
                    <option value="border-blue-500 bg-blue-50 text-blue-700">Xanh dương (Kinh doanh, dịch vụ)</option>
                    <option value="border-emerald-500 bg-emerald-50 text-emerald-700">Xanh lá (Nông nghiệp)</option>
                    <option value="border-indigo-500 bg-indigo-50 text-indigo-700">Chàm (Cán bộ, công chức)</option>
                    <option value="border-amber-500 bg-amber-50 text-amber-700">Vàng cam (Hộ thanh niên)</option>
                    <option value="border-slate-500 bg-slate-50 text-slate-700">Xám (Khó khăn, trợ cấp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên phân loại hộ gia đình *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingHouseholdType?.name || ''}
                  placeholder="VD: Hộ gia đình chính sách người có công"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả tiêu chuẩn phân loại
                </label>
                <textarea
                  name="description"
                  defaultValue={editingHouseholdType?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHouseholdTypeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {editingHouseholdType ? 'Lưu cập nhật' : 'Thêm loại hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
