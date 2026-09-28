import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  HelpCircle,
  Home,
  Lock,
  Paperclip,
  PlusCircle,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Star,
  Users,
  Users2,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EvaluationScoreItem, EvidenceFile } from '../../types';
import { ScoreModal } from '../modals/ScoreModal';
import { BatchScoreModal } from '../modals/BatchScoreModal';
import { EvidenceFileManager } from '../common/EvidenceFileManager';

export const ScoringView: React.FC = () => {
  const {
    selectedPeriod,
    selectedPeriodId,
    units,
    households,
    scores,
    terms,
    saveScore,
    submitUnitDataToXa,
    recallUnitSubmission,
    quickPassUnit,
    batchScoreHouseholds,
    toggleExemplaryHousehold,
    updateUnitReportFiles,
    getUnitProgress,
    isPeriodExpired,
    currentUser,
    canEditUnitScores,
  } = useApp();

  // Active target tab: 'household' | 'unit' (Thôn/tổ tự chấm các hộ và thôn/tổ mình)
  const [targetType, setTargetType] = useState<'household' | 'unit'>('household');

  // Selected unit filter
  const initialUnitId =
    currentUser?.role === 'to_truong' && currentUser.unitId
      ? currentUser.unitId
      : units[0]?.id || '';

  const [activeUnitId, setActiveUnitId] = useState<string>(initialUnitId);
  const [searchTerm, setSearchTerm] = useState('');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [partyFilter, setPartyFilter] = useState<'all' | 'party' | 'non_party'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'qualified' | 'unqualified' | 'exemplary' | 'violation' | 'revision'
  >('all');

  React.useEffect(() => {
    if (currentUser?.role === 'to_truong' && currentUser.unitId) {
      setActiveUnitId(currentUser.unitId);
    } else if (units.length > 0 && !units.some((u) => u.id === activeUnitId)) {
      setActiveUnitId(units[0].id);
    }
  }, [currentUser, units]);

  // Multi-select for batch scoring
  const [selectedHhIds, setSelectedHhIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Score Modal states
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoringTarget, setScoringTarget] = useState<{
    targetType: 'household' | 'unit';
    targetId: string;
    targetName: string;
    unitId: string;
    unitName: string;
    initialScore?: EvaluationScoreItem;
    readOnly?: boolean;
  } | null>(null);

  // Submit Modal states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState('');

  // Safe confirmation dialogs
  const [isQuickPassConfirmOpen, setIsQuickPassConfirmOpen] = useState(false);
  const [isRecallConfirmOpen, setIsRecallConfirmOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const effectivePeriodId = selectedPeriod?.id || selectedPeriodId;

  const currentUnit = units.find((u) => u.id === activeUnitId) || units[0];
  const unitProgress = currentUnit ? getUnitProgress(currentUnit.id, effectivePeriodId) : null;
  const expired = isPeriodExpired(selectedPeriod);

  // Permission check for this unit
  const editCheck = currentUnit ? canEditUnitScores(currentUnit.id, effectivePeriodId) : { allowed: false };
  const canEdit = editCheck.allowed;

  const handleOpenScoreModal = (
    type: 'household' | 'unit',
    targetId: string,
    targetName: string,
    forceEditable?: boolean
  ) => {
    const existing = scores.find(
      (s) => s.periodId === effectivePeriodId && s.targetType === type && s.targetId === targetId
    );

    const isLocked = unitProgress?.status === 'da_chot';
    const isReturnedHousehold = type === 'household' && existing?.returnStatus === 'returned_for_revision';

    const isReadOnly = forceEditable
      ? false
      : isReturnedHousehold
      ? isLocked
      : !canEdit;

    setScoringTarget({
      targetType: type,
      targetId,
      targetName,
      unitId: currentUnit.id,
      unitName: currentUnit.name,
      initialScore: existing,
      readOnly: isReadOnly,
    });
    setIsScoreModalOpen(true);
  };

  const handleSaveScoreFromModal = (data: any) => {
    const res = saveScore(data);
    setToast({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleConfirmSubmitToXa = () => {
    if (!currentUnit) return;
    const res = submitUnitDataToXa(currentUnit.id, effectivePeriodId, submitNotes);
    setToast({ type: res.success ? 'success' : 'error', message: res.message });
    setIsSubmitModalOpen(false);
  };

  const handleQuickPass = () => {
    if (!currentUnit) return;
    setIsQuickPassConfirmOpen(true);
  };

  const handleExecuteQuickPass = () => {
    if (!currentUnit) return;
    const res = quickPassUnit(currentUnit.id, effectivePeriodId);
    setToast({ type: res.success ? 'success' : 'error', message: res.message });
    setIsQuickPassConfirmOpen(false);
  };

  const handleToggleSelectAll = (filteredHhs: typeof households) => {
    if (selectedHhIds.length === filteredHhs.length) {
      setSelectedHhIds([]);
    } else {
      setSelectedHhIds(filteredHhs.map((h) => h.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedHhIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchConfirm = (data: {
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation' | 'ratio_90' | 'ratio_95';
    targetIds?: string[];
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }) => {
    if (!currentUnit) return;
    const idsToScore =
      data.targetIds && data.targetIds.length > 0
        ? data.targetIds
        : selectedHhIds.length > 0
        ? selectedHhIds
        : unitHouseholds.map((h) => h.id);

    if (idsToScore.length === 0) {
      setToast({ type: 'error', message: 'Không có hộ gia đình nào trong danh sách để chấm!' });
      return;
    }

    const res = batchScoreHouseholds({
      householdIds: idsToScore,
      periodId: effectivePeriodId,
      unitId: currentUnit.id,
      unitName: currentUnit.name,
      mode: data.mode,
      violationDetails: data.violationDetails,
      evidenceFiles: data.evidenceFiles,
    });
    setToast({ type: res.success ? 'success' : 'error', message: res.message });
    setSelectedHhIds([]);
  };

  const handleQuickToggleExemplary = (hhId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      setToast({ type: 'error', message: 'Hồ sơ đang bị khóa hoặc đã nộp, không thể chỉnh sửa.' });
      return;
    }
    const res = toggleExemplaryHousehold(hhId, effectivePeriodId);
    setToast({
      type: 'success',
      message: res.isExemplary
        ? 'Đã chọn Gia đình văn hóa tiêu biểu ★'
        : 'Đã bỏ chọn Gia đình văn hóa tiêu biểu',
    });
  };

  const handleRecallSubmission = () => {
    if (!currentUnit) return;
    setIsRecallConfirmOpen(true);
  };

  const handleExecuteRecall = () => {
    if (!currentUnit) return;
    const res = recallUnitSubmission(currentUnit.id, effectivePeriodId);
    setToast({ type: res.success ? 'success' : 'error', message: res.message });
    setIsRecallConfirmOpen(false);
  };

  // Filter households based on activeUnitId and filters
  const allUnitHouseholds = households.filter(
    (h) =>
      h.unitId === activeUnitId ||
      (currentUnit && h.unitName && currentUnit.name && h.unitName.trim() === currentUnit.name.trim())
  );

  // Distinct clusters in this unit
  const unitClusters = Array.from(
    new Set(allUnitHouseholds.map((h) => h.residentialCluster).filter(Boolean))
  ) as string[];

  const unitHouseholds = allUnitHouseholds
    .filter((h) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = h.headName.toLowerCase().includes(term);
        const matchCode = h.code.toLowerCase().includes(term);
        const matchAddress = h.address?.toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchAddress) return false;
      }

      if (clusterFilter !== 'all') {
        const c = h.residentialCluster || 'Cụm 1';
        if (c !== clusterFilter) return false;
      }

      if (partyFilter === 'party' && !h.isPartyMemberFamily) return false;
      if (partyFilter === 'non_party' && h.isPartyMemberFamily) return false;

      const sc = scores.find(
        (s) => s.periodId === effectivePeriodId && s.targetType === 'household' && s.targetId === h.id
      );

      if (statusFilter === 'qualified') return sc?.isQualified === true;
      if (statusFilter === 'unqualified') return sc && !sc.isQualified;
      if (statusFilter === 'exemplary') return sc?.isExemplary === true;
      if (statusFilter === 'violation') return sc?.hasViolation || (sc?.evidenceFiles && sc.evidenceFiles.length > 0);
      if (statusFilter === 'revision') return sc?.returnStatus === 'returned_for_revision';

      return true;
    });

  // Stats for this unit
  const totalUnitHhs = allUnitHouseholds.length;
  const scoredUnitHhs = allUnitHouseholds.filter((h) => {
    return scores.some(
      (s) => s.periodId === effectivePeriodId && s.targetType === 'household' && s.targetId === h.id
    );
  }).length;
  const qualifiedUnitHhs = allUnitHouseholds.filter((h) => {
    const sc = scores.find(
      (s) => s.periodId === effectivePeriodId && s.targetType === 'household' && s.targetId === h.id
    );
    return sc?.isQualified;
  }).length;
  const exemplaryUnitHhs = allUnitHouseholds.filter((h) => {
    const sc = scores.find(
      (s) => s.periodId === effectivePeriodId && s.targetType === 'household' && s.targetId === h.id
    );
    return sc?.isExemplary;
  }).length;
  const returnedUnitHhs = allUnitHouseholds.filter((h) => {
    const sc = scores.find(
      (s) => s.periodId === effectivePeriodId && s.targetType === 'household' && s.targetId === h.id
    );
    return sc?.returnStatus === 'returned_for_revision';
  }).length;
  const violationUnitHhs = allUnitHouseholds.filter((h) => {
    const sc = scores.find(
      (s) => s.periodId === effectivePeriodId && s.targetType === 'household' && s.targetId === h.id
    );
    return sc?.hasViolation || (sc && !sc.isQualified);
  }).length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Submission Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 text-red-700 rounded-lg">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Chấm Điểm & Bình Xét Theo Đợt
                </h2>
                <p className="text-xs text-slate-500">
                  Đợt xét: <strong>{selectedPeriod?.name}</strong> (Năm {selectedPeriod?.year})
                </p>
              </div>
            </div>
          </div>

          {/* Unit Selector & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Home className="w-4 h-4 text-slate-500" />
              <label className="text-xs font-semibold text-slate-700">Đang chấm đơn vị:</label>
              <select
                disabled={currentUser?.role === 'to_truong'}
                value={activeUnitId}
                onChange={(e) => {
                  setActiveUnitId(e.target.value);
                  setSelectedHhIds([]);
                }}
                className="text-xs font-bold text-slate-900 bg-transparent border-none focus:outline-hidden cursor-pointer disabled:cursor-not-allowed"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick pass button */}
            {canEdit && (
              <button
                onClick={handleQuickPass}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                title={`Chấm đạt chuẩn cho ${terms.unitLabelLower} và tất cả hộ gia đình`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Chấm nhanh toàn bộ đạt (&ge;90đ)
              </button>
            )}

            {/* Send to Commune Button */}
            {(unitProgress?.status === 'chua_gui' || unitProgress?.status === 'tra_lai') && (
              <button
                disabled={!canEdit}
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm shadow-red-700/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {unitProgress?.status === 'tra_lai' ? `Nộp lại dữ liệu lên ${terms.communeLevelLower}` : `Gửi dữ liệu lên ${terms.communeLevelLower}`}
              </button>
            )}
          </div>
        </div>

        {/* Status of this unit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Trạng thái hồ sơ đơn vị:</span>
            {unitProgress?.status === 'da_chot' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ĐÃ CHỐT DUYỆT CHÍNH THỨC (Khóa dữ liệu)
              </span>
            ) : unitProgress?.status === 'da_gui' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">
                <Send className="w-3.5 h-3.5" />
                ĐÃ GỬI LÊN {terms.communeLevel.toUpperCase()} (Đang chờ {terms.communeGov} thẩm định & duyệt)
              </span>
            ) : unitProgress?.status === 'tra_lai' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <RotateCcw className="w-3.5 h-3.5" />
                {terms.communeLevel.toUpperCase()} ĐÃ TRẢ VỀ (Yêu cầu {terms.unitLabelLower} rà soát và chấm lại)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5" />
                CHƯA GỬI (Đang trong quá trình tự chấm)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span>
              Tiến độ: <strong>{scoredUnitHhs}</strong>/{totalUnitHhs} hộ
            </span>
            <span>
              Đạt chuẩn: <strong className="text-emerald-700">{qualifiedUnitHhs}</strong> hộ (
              {totalUnitHhs > 0 ? ((qualifiedUnitHhs / totalUnitHhs) * 100).toFixed(1) : 0}%)
            </span>
            <span>
              Tiêu biểu: <strong className="text-amber-700">{exemplaryUnitHhs}</strong> hộ
            </span>
            {violationUnitHhs > 0 && (
              <span>
                Không đạt/VP: <strong className="text-rose-700">{violationUnitHhs}</strong> hộ
              </span>
            )}
            {returnedUnitHhs > 0 && (
              <span className="text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <RotateCcw className="w-3 h-3 text-rose-600 animate-spin-reverse" />
                Cần chấm lại: <strong>{returnedUnitHhs}</strong> hộ
              </span>
            )}
          </div>
        </div>

        {/* Alert banner if Commune returned the whole unit file */}
        {unitProgress?.status === 'tra_lai' && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-rose-900">
                HỒ SƠ ĐÃ ĐƯỢC {terms.communeGov.toUpperCase()} TRẢ VỀ YÊU CẦU CHẤM LẠI:
              </span>
              <p className="text-rose-800 font-medium italic">
                "{unitProgress.returnReason || `${terms.communeGov} yêu cầu rà soát và chấm lại điểm.`}"
              </p>
              <div className="text-[11px] text-rose-600 flex items-center gap-3 mt-1">
                <span>Trả bởi: <strong>{unitProgress.returnedBy || terms.communeOfficer}</strong></span>
                <span>• Thời gian: {unitProgress.returnedAt || ''}</span>
                <span>• Quyền sửa điểm: <strong className="text-emerald-700 font-bold">Đã mở lại cho {terms.unitLeader}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Alert banner if Commune returned specific households */}
        {returnedUnitHhs > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border-2 border-amber-400 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-rose-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="font-extrabold text-sm uppercase tracking-wide text-rose-950 flex items-center gap-2">
                  <span>Có {returnedUnitHhs} hộ gia đình được {terms.communeGov} trả về yêu cầu chấm lại điểm!</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                    Cần xử lý
                  </span>
                </span>
                <p className="text-slate-700">
                  {terms.unitLeader} bấm trực tiếp nút <strong className="text-rose-700 font-bold">"Chấm điểm lại"</strong> tại dòng của hộ bên dưới để cập nhật điểm mới và giải trình.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'revision' ? 'all' : 'revision')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  statusFilter === 'revision'
                    ? 'bg-rose-700 text-white shadow-rose-700/20'
                    : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {statusFilter === 'revision' ? 'Đang lọc hộ cần chấm lại' : `Xem riêng ${returnedUnitHhs} hộ cần chấm lại`}
              </button>
            </div>
          </div>
        )}

        {/* Alert banner if Unit submitted to commune (da_gui) */}
        {unitProgress?.status === 'da_gui' && (
          <div className="p-3.5 bg-blue-50 border-2 border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider text-blue-900 block">
                  HỒ SƠ ĐÃ NỘP LÊN {terms.communeLevel.toUpperCase()} (ĐANG CHỜ DUYỆT CHỐT)
                </span>
                <p className="text-slate-600 mt-0.5">
                  Dữ liệu hiện đang được gửi lên {terms.communeLevelLower}. Nếu {terms.unitLeaderLower} cần chấm bổ sung, thay đổi điểm hoặc đính kèm minh chứng, hãy bấm <strong>Thu hồi hồ sơ</strong> để mở khóa chấm lại.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRecallSubmission}
              className="shrink-0 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Thu hồi hồ sơ để chấm lại
            </button>
          </div>
        )}

        {/* Lock warning if not editable */}
        {!canEdit && unitProgress?.status !== 'da_gui' && (
          <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-slate-500" />
            <span>
              {editCheck.reason || 'Đơn vị không thể chỉnh sửa điểm trong trạng thái hiện tại.'}
            </span>
          </div>
        )}
      </div>

      {/* Target Selector Tabs: Hộ gia đình | Thôn/Tổ */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-xl">
        <button
          onClick={() => setTargetType('household')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            targetType === 'household'
              ? 'border-red-600 text-red-700 bg-red-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Bình xét Hộ gia đình ({unitHouseholds.length})</span>
        </button>

        <button
          onClick={() => setTargetType('unit')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition -mb-px cursor-pointer ${
            targetType === 'unit'
              ? 'border-red-600 text-red-700 bg-red-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>2. Tự chấm {terms.unitLabel} & Hồ sơ Báo cáo ({currentUnit ? currentUnit.name : ''})</span>
        </button>
      </div>

      {/* Content depending on targetType */}
      <div className="bg-white rounded-b-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* TAB 1: HOUSEHOLDS */}
        {targetType === 'household' && (
          <div className="space-y-4">
            {/* Filter and search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm nhanh hộ gia đình (tên, mã, địa chỉ)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả ({allUnitHouseholds.length})</option>
                    <option value="qualified">Đạt chuẩn (≥90đ)</option>
                    <option value="unqualified">Chưa đạt (&lt;90đ)</option>
                    <option value="exemplary">Gia đình VH Tiêu biểu ★</option>
                    <option value="violation">Có vi phạm / minh chứng 📎</option>
                    <option value="revision">Cần chấm lại ({terms.communeLevel} trả) {returnedUnitHhs > 0 ? `(${returnedUnitHhs}) ⚠️` : ''}</option>
                  </select>
                </div>

                {returnedUnitHhs > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === 'revision' ? 'all' : 'revision')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      statusFilter === 'revision'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 animate-pulse'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Hộ cần chấm lại ({returnedUnitHhs})
                  </button>
                )}

                {unitClusters.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                    <Users2 className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={clusterFilter}
                      onChange={(e) => setClusterFilter(e.target.value)}
                      className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả Cụm dân cư</option>
                      {unitClusters.map((cluster) => (
                        <option key={cluster} value={cluster}>
                          {cluster}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <select
                    value={partyFilter}
                    onChange={(e: any) => setPartyFilter(e.target.value)}
                    className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">Toàn bộ hộ</option>
                    <option value="party">★ Hộ Đảng viên</option>
                    <option value="non_party">Hộ quần chúng</option>
                  </select>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedHhIds.length === unitHouseholds.length) {
                        setSelectedHhIds([]);
                      } else {
                        setSelectedHhIds(unitHouseholds.map((h) => h.id));
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                    {selectedHhIds.length === unitHouseholds.length && unitHouseholds.length > 0
                      ? 'Bỏ chọn tất cả'
                      : 'Chọn tất cả hộ'}
                  </button>

                  <button
                    onClick={() => {
                      if (selectedHhIds.length === 0) {
                        // If none selected, auto-select all unit households for convenience!
                        if (unitHouseholds.length > 0) {
                          setSelectedHhIds(unitHouseholds.map((h) => h.id));
                        } else {
                          setToast({ type: 'error', message: 'Không có hộ gia đình nào trong danh sách!' });
                          return;
                        }
                      }
                      setIsBatchModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Chấm nhanh nhiều hộ ({selectedHhIds.length || unitHouseholds.length})
                  </button>
                </div>
              )}
            </div>

            {/* Pinned Batch Action Bar */}
            {selectedHhIds.length > 0 && canEdit && (
              <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg">
                    Đã chọn {selectedHhIds.length} hộ gia đình
                  </span>
                  <span className="text-xs text-amber-900 font-medium">
                    Thao tác nhanh cho các hộ đã tích chọn:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      handleBatchConfirm({
                        mode: 'pass_90',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Chấm 90 điểm chuẩn cho các hộ đã chọn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Chấm Đạt (90đ)
                  </button>
                  <button
                    onClick={() =>
                      handleBatchConfirm({
                        mode: 'pass_95',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Chấm 95 điểm loại Tốt cho các hộ đã chọn"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Chấm Tốt (95đ)
                  </button>
                  <button
                    onClick={() =>
                      handleBatchConfirm({
                        mode: 'ratio_90',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Phân bổ 90% số hộ đạt chuẩn (chuẩn nông thôn)"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Đạt tỷ lệ 90%
                  </button>
                  <button
                    onClick={() =>
                      handleBatchConfirm({
                        mode: 'ratio_95',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Phân bổ 95% số hộ đạt chuẩn (chuẩn đô thị)"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Đạt tỷ lệ 95%
                  </button>
                  <button
                    onClick={() =>
                      handleBatchConfirm({
                        mode: 'set_exemplary',
                      })
                    }
                    className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Chọn Tiêu biểu
                  </button>
                  <button
                    onClick={() => setIsBatchModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Tùy chọn khác...
                  </button>
                  <button
                    onClick={() => setSelectedHhIds([])}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {/* Households Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    {canEdit && (
                      <th className="p-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAll(unitHouseholds)}
                          className="text-slate-500 hover:text-red-700 cursor-pointer"
                          title="Chọn / bỏ chọn tất cả"
                        >
                          {selectedHhIds.length > 0 && selectedHhIds.length === unitHouseholds.length ? (
                            <CheckSquare className="w-4 h-4 text-red-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="p-3 w-10 text-center">STT</th>
                    <th className="p-3">Mã hộ</th>
                    <th className="p-3">Chủ hộ & Địa chỉ</th>
                    <th className="p-3">Cụm dân cư</th>
                    <th className="p-3 text-center">TC1 (30đ)</th>
                    <th className="p-3 text-center">TC2 (30đ)</th>
                    <th className="p-3 text-center">TC3 (30đ)</th>
                    <th className="p-3 text-center">TC4 (10đ)</th>
                    <th className="p-3 text-center">Cộng/Trừ</th>
                    <th className="p-3 text-center">Tổng điểm</th>
                    <th className="p-3 text-center">Danh hiệu & Minh chứng</th>
                    <th className="p-3 text-center w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {unitHouseholds.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-400">
                        Không tìm thấy hộ gia đình nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    unitHouseholds.map((hh, idx) => {
                      const sc = scores.find(
                        (s) =>
                          s.periodId === effectivePeriodId &&
                          s.targetType === 'household' &&
                          s.targetId === hh.id
                      );
                      const isSelected = selectedHhIds.includes(hh.id);
                      const isReturnedForRevision = sc?.returnStatus === 'returned_for_revision';
                      const isLocked = unitProgress?.status === 'da_chot';
                      const canEditThisRow = canEdit || (isReturnedForRevision && !isLocked);

                      return (
                        <tr
                          key={hh.id}
                          className={`transition ${
                            isReturnedForRevision
                              ? 'bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-l-rose-500'
                              : isSelected
                              ? 'bg-amber-50/50 hover:bg-amber-100/50'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {canEdit && (
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelectOne(hh.id)}
                                className="text-slate-400 hover:text-red-700 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-red-700" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )}
                          <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{hh.code}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{hh.headName}</span>
                              {hh.isPartyMemberFamily && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 shadow-2xs"
                                  title={`Gia đình Đảng viên (${hh.partyMemberCount || 1} Đảng viên)`}
                                >
                                  ★ Đảng viên
                                </span>
                              )}
                              {sc?.isExemplary && (
                                <span
                                  className="p-0.5 text-amber-500 hover:text-amber-600 cursor-pointer"
                                  title="Gia đình Văn hóa Tiêu biểu"
                                  onClick={(e) => handleQuickToggleExemplary(hh.id, e)}
                                >
                                  <Star className="w-4 h-4 fill-amber-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{hh.address}</div>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {hh.residentialCluster || 'Cụm 1'}
                            </span>
                          </td>

                          {/* Scores breakdown */}
                          <td className="p-3 text-center font-medium">
                            {sc ? `${sc.criteriaScores.standard1}/30` : '—'}
                          </td>
                          <td className="p-3 text-center font-medium">
                            {sc ? `${sc.criteriaScores.standard2}/30` : '—'}
                          </td>
                          <td className="p-3 text-center font-medium">
                            {sc ? `${sc.criteriaScores.standard3}/30` : '—'}
                          </td>
                          <td className="p-3 text-center font-medium">
                            {sc ? `${sc.criteriaScores.standard4}/10` : '—'}
                          </td>
                          <td className="p-3 text-center text-[11px]">
                            {sc ? (
                              <span className="font-mono">
                                +{sc.bonusPoints} / -{sc.penaltyPoints}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {sc ? (
                              <span className="font-extrabold text-sm text-slate-900">
                                {sc.finalScore}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa chấm</span>
                            )}
                          </td>

                          {/* Status and badges */}
                          <td className="p-3 text-center">
                            {sc ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                  {sc.isQualified ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Đạt chuẩn
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                      Chưa đạt
                                    </span>
                                  )}

                                  {sc.isExemplary && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                                      Tiêu biểu
                                    </span>
                                  )}
                                </div>

                                {sc.returnStatus === 'returned_for_revision' && (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-xs animate-pulse"
                                      title={`Lý do: ${sc.returnReason || 'Xã yêu cầu chấm lại'}`}
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Cần chấm lại
                                    </span>
                                    {sc.returnReason && (
                                      <span
                                        className="text-[10px] text-rose-800 font-medium italic max-w-[130px] line-clamp-1"
                                        title={sc.returnReason}
                                      >
                                        "{sc.returnReason}"
                                      </span>
                                    )}
                                  </div>
                                )}

                                {sc.returnStatus === 'revised' && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300"
                                    title={sc.revisedAt ? `Đã chấm lại lúc: ${sc.revisedAt}` : 'Đã chấm lại'}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    Đã chấm lại
                                  </span>
                                )}

                                {sc.evidenceFiles && sc.evidenceFiles.length > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold hover:underline cursor-pointer"
                                    onClick={() =>
                                      handleOpenScoreModal('household', hh.id, `Hộ ${hh.headName}`)
                                    }
                                  >
                                    <Paperclip className="w-3 h-3 text-blue-600" />
                                    {sc.evidenceFiles.length} minh chứng
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isReturnedForRevision ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenScoreModal(
                                      'household',
                                      hh.id,
                                      `Hộ ${hh.headName}`,
                                      true /* forceEditable */
                                    )
                                  }
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white shadow-md shadow-rose-600/25 ring-2 ring-amber-400 hover:ring-amber-500 cursor-pointer animate-pulse"
                                  title={`UBND Xã yêu cầu chấm lại: ${sc?.returnReason || 'Rà soát và chấm lại điểm'}`}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Chấm điểm lại
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenScoreModal('household', hh.id, `Hộ ${hh.headName}`)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    canEditThisRow
                                      ? sc
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                                        : 'bg-red-700 hover:bg-red-800 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {canEditThisRow ? (sc ? 'Sửa điểm' : 'Chấm điểm') : 'Xem'}
                                </button>
                              )}

                              {canEditThisRow && (
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickToggleExemplary(hh.id, e)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    sc?.isExemplary
                                      ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                                  }`}
                                  title={sc?.isExemplary ? 'Bỏ chọn Tiêu biểu' : 'Chọn làm GĐVH Tiêu biểu'}
                                >
                                  <Star
                                    className={`w-4 h-4 ${sc?.isExemplary ? 'fill-amber-400' : ''}`}
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: UNIT SCORING & REPORT FILES */}
        {targetType === 'unit' && currentUnit && (
          <div className="space-y-5 max-w-4xl mx-auto py-2">
            <div className="p-5 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-700 text-white rounded-lg shadow-sm">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-700">
                      Tự đánh giá danh hiệu {terms.unitCulturalTitle}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {currentUnit.name} ({currentUnit.code})
                    </h3>
                  </div>
                </div>

                {/* Score Status Tag */}
                <div>
                  {(() => {
                    const sc = scores.find(
                      (s) =>
                        s.periodId === effectivePeriodId &&
                        s.targetType === 'unit' &&
                        s.targetId === currentUnit.id
                    );
                    if (!sc) {
                      return (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                          Chưa tự chấm điểm
                        </span>
                      );
                    }
                    return (
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">
                          {sc.finalScore} <span className="text-xs text-slate-500">/ 100đ</span>
                        </div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sc.isQualified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sc.isQualified ? `ĐẠT CHUẨN ${terms.unitCulturalTitle.toUpperCase()}` : 'CHƯA ĐẠT CHUẨN'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">{terms.unitLeader}:</span>
                  <strong className="text-slate-800 text-xs">{currentUnit.leaderName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <strong className="text-slate-800 text-xs">{currentUnit.leaderPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Tổng số hộ dân:</span>
                  <strong className="text-slate-800 text-xs">{currentUnit.totalHouseholds} hộ</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Tỷ lệ hộ đạt chuẩn:</span>
                  <strong className="text-emerald-700 font-bold text-xs">
                    {totalUnitHhs > 0 ? ((qualifiedUnitHhs / totalUnitHhs) * 100).toFixed(1) : 0}%
                  </strong>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleOpenScoreModal('unit', currentUnit.id, currentUnit.name)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    canEdit
                      ? 'bg-red-700 hover:bg-red-800 text-white shadow-md shadow-red-700/20 cursor-pointer'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  {canEdit ? `Nhập & Chỉnh sửa Phiếu Chấm ${terms.unitLabel}` : 'Xem chi tiết Phiếu Chấm'}
                </button>
              </div>
            </div>

            {/* Section: File Báo Cáo Liên Quan Của Thôn / Tổ */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <EvidenceFileManager
                files={unitProgress?.reportFiles || currentUnit.reportFiles || []}
                onChange={(newFiles) => {
                  updateUnitReportFiles(currentUnit.id, effectivePeriodId, newFiles);
                }}
                readOnly={!canEdit}
                category="bao_cao_to"
                templateType="bao_cao_to"
                title={`Hồ sơ & File Báo cáo liên quan của ${terms.unitLabel}`}
                description={`Đính kèm Báo cáo thành tích xây dựng ${terms.unitCulturalTitle}, Biên bản cuộc họp bình xét toàn thể nhân dân...`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Score Modal */}
      {scoringTarget && (
        <ScoreModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          targetType={scoringTarget.targetType}
          targetId={scoringTarget.targetId}
          targetName={scoringTarget.targetName}
          unitId={scoringTarget.unitId}
          unitName={scoringTarget.unitName}
          periodId={effectivePeriodId}
          initialScore={scoringTarget.initialScore}
          readOnly={scoringTarget.readOnly}
          onSave={handleSaveScoreFromModal}
        />
      )}

      {/* Batch Scoring Modal */}
      {isBatchModalOpen && (
        <BatchScoreModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          selectedHouseholds={
            selectedHhIds.length > 0
              ? allUnitHouseholds.filter((h) => selectedHhIds.includes(h.id))
              : unitHouseholds
          }
          unitName={currentUnit.name}
          periodName={selectedPeriod?.name || ''}
          onConfirmBatch={handleBatchConfirm}
        />
      )}

      {/* Confirmation Modal to Submit Data from Tổ to Xã */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-red-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Send className="w-5 h-5" />
                Xác nhận gửi dữ liệu lên Xã
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  LƯU Ý QUAN TRỌNG:
                </div>
                <p>
                  • Sau khi gửi dữ liệu lên UBND Xã, <strong>cấp tổ sẽ không được phép chỉnh sửa tiếp</strong> hồ sơ chấm điểm của đơn vị mình.
                </p>
                <p>
                  • Cán bộ xã sẽ tiếp nhận để thẩm định, kiểm tra các hồ sơ minh chứng, hoặc trả lại nếu cần chỉnh sửa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú hoặc kiến nghị kèm theo (nếu có):
                </label>
                <textarea
                  rows={3}
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="VD: Tổ đã họp và thống nhất kết quả bình xét ngày..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmitToXa}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Xác nhận nộp lên Xã
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Quick Pass Confirmation Modal */}
      {isQuickPassConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                Xác nhận tự chấm nhanh toàn bộ đơn vị
              </h3>
              <button
                onClick={() => setIsQuickPassConfirmOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Hệ thống sẽ tự động chấm đạt chuẩn (&ge; 90 điểm) cho Thôn/Tổ <strong>"{currentUnit?.name}"</strong> và toàn bộ <strong>{unitHouseholds.length} hộ gia đình</strong> trực thuộc.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
                ✓ Sau khi chấm nhanh, bạn vẫn có thể chỉnh sửa điểm từng hộ hoặc khai báo vi phạm/tiêu biểu trước khi nộp lên xã.
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickPassConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteQuickPass}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Xác nhận chấm nhanh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recall Confirmation Modal */}
      {isRecallConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-amber-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-200" />
                Xác nhận thu hồi hồ sơ
              </h3>
              <button
                onClick={() => setIsRecallConfirmOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Bạn có chắc chắn muốn thu hồi hồ sơ của <strong>"{currentUnit?.name}"</strong> để tiếp tục chấm điểm và chỉnh sửa? Sau khi thu hồi, tổ trưởng có thể chấm lại hoặc sửa điểm bình thường.
              </p>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecallConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRecall}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Xác nhận thu hồi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-slate-700 text-xs font-medium backdrop-blur-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
