import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Lock,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EvaluationScoreItem, EvidenceFile, Unit } from '../../types';
import { ScoreModal } from '../modals/ScoreModal';
import { ReturnSubmissionModal } from '../modals/ReturnSubmissionModal';
import { PeriodDecisionModal } from '../modals/PeriodDecisionModal';
import { BatchScoreModal } from '../modals/BatchScoreModal';
import { EvidenceFileManager } from '../common/EvidenceFileManager';

export const ApprovalView: React.FC = () => {
  const {
    units,
    clans,
    households,
    scores,
    progressList,
    selectedPeriod,
    selectedPeriodId,
    getUnitProgress,
    approveAndLockUnit,
    quickPassUnit,
    saveScore,
    batchScoreHouseholds,
    toggleExemplaryHousehold,
    returnUnitSubmission,
    returnHouseholdScore,
    updatePeriodDecisionFile,
    updateUnitReportFiles,
    currentUser,
    selectedCommune,
  } = useApp();

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'chua_gui' | 'da_gui' | 'tra_lai' | 'da_chot'
  >('all');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Modals
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<{
    type: 'unit' | 'household';
    id: string;
    name: string;
    unitName?: string;
  } | null>(null);

  // Batch scoring for commune
  const [selectedHhIds, setSelectedHhIds] = useState<string[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Always bind activeUnit to the currently filtered units of the selected commune
  const activeUnit = units.find((u) => u.id === selectedUnit?.id) || units[0] || null;

  // Detailed scoring modal for commune officer
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoringTarget, setScoringTarget] = useState<{
    targetType: 'household' | 'unit' | 'clan';
    targetId: string;
    targetName: string;
    unitId: string;
    unitName: string;
    initialScore?: EvaluationScoreItem;
    readOnly?: boolean;
  } | null>(null);

  if (currentUser?.role === 'to_truong') {
    return (
      <div className="bg-white p-8 rounded-xl border border-amber-200 text-center max-w-lg mx-auto space-y-3">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Quyền hạn Cấp Xã / Phường</h3>
        <p className="text-xs text-slate-500">
          Chức năng Thẩm định & Duyệt chốt dữ liệu văn hóa chỉ dành cho Cán bộ Xã/Phường và Ban chỉ đạo cấp xã.
        </p>
      </div>
    );
  }

  const filteredUnits = units.filter((u) => {
    const prog = getUnitProgress(u.id, selectedPeriodId);
    if (filterStatus === 'all') return true;
    return prog.status === filterStatus;
  });

  const activeUnitProg = activeUnit ? getUnitProgress(activeUnit.id, selectedPeriodId) : null;
  const isLocked = activeUnitProg?.status === 'da_chot';

  // Details for selected unit
  const unitHhs = activeUnit ? households.filter((h) => h.unitId === activeUnit.id) : [];
  const qualifiedHhCount = unitHhs.filter((h) => {
    const sc = scores.find(
      (s) => s.periodId === selectedPeriodId && s.targetType === 'household' && s.targetId === h.id
    );
    return sc?.isQualified;
  }).length;

  const exemplaryHhCount = unitHhs.filter((h) => {
    const sc = scores.find(
      (s) => s.periodId === selectedPeriodId && s.targetType === 'household' && s.targetId === h.id
    );
    return sc?.isExemplary;
  }).length;

  const unitScore = activeUnit
    ? scores.find(
        (s) =>
          s.periodId === selectedPeriodId && s.targetType === 'unit' && s.targetId === activeUnit.id
      )
    : null;

  const unitClans = activeUnit ? clans.filter((c) => c.unitId === activeUnit.id) : [];

  const handleOpenScoreModal = (
    type: 'household' | 'unit' | 'clan',
    targetId: string,
    targetName: string
  ) => {
    if (!activeUnit) return;
    const existing = scores.find(
      (s) => s.periodId === selectedPeriodId && s.targetType === type && s.targetId === targetId
    );

    setScoringTarget({
      targetType: type,
      targetId,
      targetName,
      unitId: activeUnit.id,
      unitName: activeUnit.name,
      initialScore: existing,
      readOnly: isLocked,
    });
    setIsScoreModalOpen(true);
  };

  const handleQuickPassForUnit = () => {
    if (!activeUnit) return;
    if (
      window.confirm(
        `Thực hiện "Chấm nhanh đạt (>= 90đ)" cho toàn bộ hộ và thôn/tổ "${activeUnit.name}" theo thẩm quyền cấp Xã?`
      )
    ) {
      const res = quickPassUnit(activeUnit.id, selectedPeriodId);
      alert(res.message);
    }
  };

  const handleConfirmApprovalAndLock = () => {
    if (!activeUnit) return;
    const res = approveAndLockUnit(activeUnit.id, selectedPeriodId, approvalNotes);
    alert(res.message);
    setIsApproveModalOpen(false);
  };

  const handleConfirmReturn = (reason: string) => {
    if (!returnTarget) return;
    if (returnTarget.type === 'unit') {
      const res = returnUnitSubmission(returnTarget.id, selectedPeriodId, reason);
      alert(res.message);
    } else {
      const res = returnHouseholdScore(returnTarget.id, selectedPeriodId, reason);
      alert(res.message);
    }
    setReturnTarget(null);
  };

  const handleSaveDecision = (data: {
    decisionNumber: string;
    decisionDate: string;
    decisionSigner: string;
    decisionFile?: EvidenceFile;
    isFinalized?: boolean;
  }) => {
    const res = updatePeriodDecisionFile(selectedPeriodId, data);
    alert(res.message);
  };

  const handleBatchConfirm = (data: {
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation';
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }) => {
    if (!activeUnit || selectedHhIds.length === 0) return;
    const res = batchScoreHouseholds({
      householdIds: selectedHhIds,
      periodId: selectedPeriodId,
      unitId: activeUnit.id,
      unitName: activeUnit.name,
      mode: data.mode,
      violationDetails: data.violationDetails,
      evidenceFiles: data.evidenceFiles,
    });
    alert(res.message);
    setSelectedHhIds([]);
  };

  const totalLockedUnits = units.filter(
    (u) => getUnitProgress(u.id, selectedPeriodId).status === 'da_chot'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Decision File Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: General Info & Filter (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shadow-xs">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Duyệt & Thẩm Định Dữ Liệu Cấp Xã / Phường
                </h2>
                {selectedCommune && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {selectedCommune.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đợt xét: <strong>{selectedPeriod?.name}</strong> • Tiến độ chốt:{' '}
                <strong className="text-emerald-700">
                  {totalLockedUnits}/{units.length} thôn/tổ
                </strong>
              </p>
            </div>
          </div>

          {/* Status filter bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({units.length})
            </button>
            <button
              onClick={() => setFilterStatus('chua_gui')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterStatus === 'chua_gui'
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Chưa gửi
            </button>
            <button
              onClick={() => setFilterStatus('da_gui')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterStatus === 'da_gui'
                  ? 'bg-blue-100 text-blue-900 shadow-xs'
                  : 'text-blue-800 hover:text-blue-950'
              }`}
            >
              Đã gửi
            </button>
            <button
              onClick={() => setFilterStatus('tra_lai')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterStatus === 'tra_lai'
                  ? 'bg-rose-100 text-rose-900 shadow-xs'
                  : 'text-rose-800 hover:text-rose-950'
              }`}
            >
              Đã trả về
            </button>
            <button
              onClick={() => setFilterStatus('da_chot')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterStatus === 'da_chot'
                  ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              Đã chốt
            </button>
          </div>
        </div>

        {/* Right: Official Recognition Decision of the Commune (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-red-800 via-red-900 to-amber-900 text-white p-5 rounded-xl shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-400 text-red-950 rounded-lg shadow-sm">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                  Văn bản chỉ đạo cấp Xã
                </span>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Quyết định Công nhận của UBND
                </h3>
              </div>
            </div>
            <button
              onClick={() => setIsDecisionModalOpen(true)}
              className="px-3 py-1 text-xs font-bold text-red-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-xs cursor-pointer"
            >
              {selectedPeriod?.decisionNumber ? 'Cập nhật QĐ' : 'Ban hành QĐ'}
            </button>
          </div>

          <div className="text-xs space-y-1 bg-black/20 p-2.5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Số quyết định:</span>
              <strong className="text-white font-mono">
                {selectedPeriod?.decisionNumber || 'Chưa ban hành'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Ngày ký:</span>
              <span className="text-white font-medium">{selectedPeriod?.decisionDate || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Người ký:</span>
              <span className="text-white font-medium truncate max-w-[200px]">
                {selectedPeriod?.decisionSigner || 'Chủ tịch UBND'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/15">
            <span className="text-white/80 text-[11px]">
              {selectedPeriod?.decisionFile ? (
                <span className="text-amber-200 font-semibold flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  Đã đính kèm tệp số hóa ({selectedPeriod.decisionFile.name})
                </span>
              ) : (
                'Chưa đính kèm file quyết định'
              )}
            </span>
            {selectedPeriod?.decisionFile && (
              <button
                onClick={() => {
                  const f = selectedPeriod.decisionFile!;
                  const a = document.createElement('a');
                  a.href = f.dataUrl || '#';
                  a.download = f.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="text-amber-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Tải về
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Units List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Danh sách Thôn / Tổ ({filteredUnits.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Nhấp để xem chi tiết</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
            {filteredUnits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Không có đơn vị nào thuộc trạng thái này.
              </div>
            ) : (
              filteredUnits.map((u) => {
                const prog = getUnitProgress(u.id, selectedPeriodId);
                const isSelected = activeUnit?.id === u.id;

                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUnit(u);
                      setSelectedHhIds([]);
                    }}
                    className={`p-4 cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-50/60 border-l-4 border-red-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({u.code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Trưởng đơn vị: {u.leaderName} • {u.totalHouseholds} hộ
                      </div>
                    </div>

                    <div className="shrink-0">
                      {prog.status === 'da_chot' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Đã chốt
                        </span>
                      ) : prog.status === 'da_gui' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Đã gửi
                        </span>
                      ) : prog.status === 'tra_lai' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Đã trả về
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Chưa gửi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail & Approval Dashboard (8 cols) */}
        {activeUnit && (
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            {/* Header info for selected unit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{activeUnit.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 font-mono text-slate-700 rounded-sm font-semibold">
                    {activeUnit.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Trưởng đơn vị: <strong>{activeUnit.leaderName}</strong> ({activeUnit.leaderPhone})
                  {activeUnitProg?.submittedAt && ` • Nộp lúc: ${activeUnitProg.submittedAt}`}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {isLocked ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>ĐÃ DUYỆT CHỐT CẤP XÃ</span>
                  </div>
                ) : activeUnitProg?.status === 'da_gui' ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-100 border border-blue-300 text-blue-900 rounded-lg text-xs font-bold shadow-xs">
                    <Send className="w-4 h-4 text-blue-700" />
                    <span>TỔ ĐÃ NỘP — ĐANG CHỜ XÃ DUYỆT</span>
                  </div>
                ) : activeUnitProg?.status === 'tra_lai' ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-lg text-xs font-bold shadow-xs">
                    <RotateCcw className="w-4 h-4 text-rose-700" />
                    <span>ĐÃ TRẢ HỒ SƠ YÊU CẦU CHẤM LẠI</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold shadow-xs">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>TỔ CHƯA NỘP (XÃ CÓ THỂ CHẤM THAY)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Return Reason Warning Banner if unit was returned */}
            {activeUnitProg?.status === 'tra_lai' && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider text-rose-900">
                    Nội dung yêu cầu Thôn/Tổ chấm lại:
                  </span>
                  <p className="text-rose-800 italic mt-0.5">
                    "{activeUnitProg.returnReason || 'Cần kiểm tra lại hồ sơ và báo cáo.'}"
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    Trả bởi: {activeUnitProg.returnedBy || 'Cán bộ Xã'} lúc {activeUnitProg.returnedAt}
                  </p>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Tổng hộ dân:</span>
                <strong className="text-slate-900 text-sm">{unitHhs.length} hộ</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Hộ đạt chuẩn (≥90đ):</span>
                <strong className="text-emerald-700 text-sm font-bold">
                  {qualifiedHhCount} hộ (
                  {unitHhs.length > 0 ? ((qualifiedHhCount / unitHhs.length) * 100).toFixed(1) : 0}%)
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Gia đình VH Tiêu biểu:</span>
                <strong className="text-amber-700 text-sm font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {exemplaryHhCount} hộ
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Điểm Thôn/Tổ:</span>
                <strong className="text-slate-900 text-sm">
                  {unitScore
                    ? `${unitScore.finalScore}đ (${unitScore.isQualified ? 'Đạt' : 'Chưa đạt'})`
                    : 'Chưa chấm'}
                </strong>
              </div>
            </div>

            {/* Operational Action Bar for Commune */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-red-50/50 border border-red-200/70 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Thao tác thẩm định & Phê duyệt:</h4>
                <p className="text-[11px] text-slate-500">
                  {isLocked
                    ? 'Dữ liệu đã duyệt chốt, hồ sơ đã được niêm phong chính thức.'
                    : activeUnitProg?.status === 'da_gui'
                    ? 'Bạn có thể chấm lại, trả hồ sơ cho tổ chấm lại, hoặc Duyệt chốt để hoàn thành.'
                    : 'Cán bộ xã có thể chấm nhanh đạt hoặc chấm chi tiết thay tổ, sau đó Duyệt chốt.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isLocked && (
                  <>
                    <button
                      onClick={handleQuickPassForUnit}
                      className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Chấm nhanh đạt (≥90đ)
                    </button>

                    {/* Return unit submission button */}
                    <button
                      onClick={() =>
                        setReturnTarget({
                          type: 'unit',
                          id: activeUnit.id,
                          name: activeUnit.name,
                        })
                      }
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      title="Trả toàn bộ hồ sơ để Thôn/Tổ rà soát và chấm lại"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      Trả hồ sơ để Tổ chấm lại
                    </button>

                    <button
                      onClick={() => setIsApproveModalOpen(true)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Duyệt Chốt Hồ Sơ (Khóa)
                    </button>
                  </>
                )}

                {isLocked && (
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-lg border border-emerald-300">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    Đã khóa bảo mật (Duyệt bởi: {activeUnitProg?.approvedBy || 'Cán bộ Xã'})
                  </div>
                )}
              </div>
            </div>

            {/* Section: Report Files of the Unit (Tổ dân phố văn hóa cần có các file báo cáo liên quan) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <EvidenceFileManager
                files={activeUnitProg?.reportFiles || activeUnit.reportFiles || []}
                onChange={(newFiles) => {
                  updateUnitReportFiles(activeUnit.id, selectedPeriodId, newFiles);
                }}
                readOnly={isLocked}
                category="bao_cao_to"
                templateType="bao_cao_to"
                title={`Hồ sơ & File Báo cáo của ${activeUnit.name}`}
                description="Báo cáo thành tích xây dựng Thôn/Tổ văn hóa, Biên bản họp bình xét công khai toàn dân..."
              />
            </div>

            {/* List of Households */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Chi tiết điểm các hộ gia đình thuộc {activeUnit.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Xã có thể trả hồ sơ riêng từng hộ hoặc bình chọn Gia đình Văn hóa Tiêu biểu
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isLocked && (
                    <button
                      onClick={() => {
                        if (selectedHhIds.length === 0) {
                          alert('Vui lòng tích chọn các hộ để thao tác nhanh.');
                          return;
                        }
                        setIsBatchModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Chấm nhanh hộ ({selectedHhIds.length})
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleOpenScoreModal('unit', activeUnit.id, `Điểm Thôn/Tổ: ${activeUnit.name}`)
                    }
                    className="text-xs text-red-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    {isLocked ? 'Xem điểm Thôn/Tổ' : 'Chấm/Sửa điểm Thôn/Tổ'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      {!isLocked && (
                        <th className="p-2.5 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedHhIds.length > 0 && selectedHhIds.length === unitHhs.length}
                            onChange={() => {
                              if (selectedHhIds.length === unitHhs.length) setSelectedHhIds([]);
                              else setSelectedHhIds(unitHhs.map((h) => h.id));
                            }}
                            className="rounded text-red-600 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="p-2.5 w-10 text-center">STT</th>
                      <th className="p-2.5">Mã hộ</th>
                      <th className="p-2.5">Chủ hộ</th>
                      <th className="p-2.5 text-center">Tổng điểm</th>
                      <th className="p-2.5 text-center">Kết quả & Danh hiệu</th>
                      <th className="p-2.5 text-center">Minh chứng</th>
                      <th className="p-2.5 text-center w-36">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {unitHhs.map((hh, idx) => {
                      const sc = scores.find(
                        (s) =>
                          s.periodId === selectedPeriodId &&
                          s.targetType === 'household' &&
                          s.targetId === hh.id
                      );

                      return (
                        <tr key={hh.id} className="hover:bg-slate-50">
                          {!isLocked && (
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={selectedHhIds.includes(hh.id)}
                                onChange={() =>
                                  setSelectedHhIds((prev) =>
                                    prev.includes(hh.id)
                                      ? prev.filter((id) => id !== hh.id)
                                      : [...prev, hh.id]
                                  )
                                }
                                className="rounded text-red-600 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{hh.code}</td>
                          <td className="p-2.5 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{hh.headName}</span>
                              {sc?.isExemplary && (
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800">
                            {sc ? `${sc.finalScore}đ` : '—'}
                          </td>
                          <td className="p-2.5 text-center">
                            {sc ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                  {sc.isQualified ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      ✓ Đạt chuẩn
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      ✕ Chưa đạt
                                    </span>
                                  )}

                                  {sc.isExemplary && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <Star className="w-3 h-3 fill-amber-500" />
                                      Tiêu biểu
                                    </span>
                                  )}
                                </div>

                                {sc.returnStatus === 'returned_for_revision' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                                    Đã yêu cầu chấm lại
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa chấm</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {sc?.evidenceFiles && sc.evidenceFiles.length > 0 ? (
                              <button
                                onClick={() =>
                                  handleOpenScoreModal('household', hh.id, `Hộ ${hh.headName}`)
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                              >
                                <Paperclip className="w-3 h-3" />
                                {sc.evidenceFiles.length} tệp
                              </button>
                            ) : sc?.hasViolation ? (
                              <span className="text-[10px] font-semibold text-rose-700">
                                Có vi phạm
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  handleOpenScoreModal('household', hh.id, `Hộ ${hh.headName}`)
                                }
                                className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 rounded-md text-slate-800 transition cursor-pointer"
                              >
                                {isLocked ? 'Xem' : 'Chấm lại'}
                              </button>

                              {!isLocked && (
                                <>
                                  <button
                                    onClick={() =>
                                      toggleExemplaryHousehold(hh.id, selectedPeriodId)
                                    }
                                    className={`p-1 rounded-md transition cursor-pointer ${
                                      sc?.isExemplary
                                        ? 'text-amber-500 bg-amber-50'
                                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                                    }`}
                                    title={
                                      sc?.isExemplary ? 'Bỏ chọn Tiêu biểu' : 'Chọn làm GĐVH Tiêu biểu'
                                    }
                                  >
                                    <Star
                                      className={`w-3.5 h-3.5 ${
                                        sc?.isExemplary ? 'fill-amber-400' : ''
                                      }`}
                                    />
                                  </button>

                                  <button
                                    onClick={() =>
                                      setReturnTarget({
                                        type: 'household',
                                        id: hh.id,
                                        name: `Hộ ${hh.headName}`,
                                        unitName: activeUnit.name,
                                      })
                                    }
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                    title="Trả hồ sơ hộ này để Tổ chấm lại"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Score for Commune */}
      {scoringTarget && (
        <ScoreModal
          isOpen={isScoreModalOpen}
          onClose={() => setIsScoreModalOpen(false)}
          targetType={scoringTarget.targetType}
          targetId={scoringTarget.targetId}
          targetName={scoringTarget.targetName}
          unitId={scoringTarget.unitId}
          unitName={scoringTarget.unitName}
          periodId={selectedPeriodId}
          initialScore={scoringTarget.initialScore}
          readOnly={scoringTarget.readOnly}
          onSave={(data) => {
            const res = saveScore(data);
            alert(res.message);
          }}
        />
      )}

      {/* Period Decision Modal */}
      {isDecisionModalOpen && selectedPeriod && (
        <PeriodDecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          period={selectedPeriod}
          communeName={selectedCommune?.name || 'Xã / Phường'}
          onSaveDecision={handleSaveDecision}
        />
      )}

      {/* Return Submission Modal */}
      {returnTarget && (
        <ReturnSubmissionModal
          isOpen={!!returnTarget}
          onClose={() => setReturnTarget(null)}
          targetType={returnTarget.type}
          targetName={returnTarget.name}
          unitName={returnTarget.unitName}
          onConfirm={handleConfirmReturn}
        />
      )}

      {/* Batch Score Modal */}
      {isBatchModalOpen && activeUnit && (
        <BatchScoreModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          selectedHouseholds={unitHhs.filter((h) => selectedHhIds.includes(h.id))}
          unitName={activeUnit.name}
          periodName={selectedPeriod?.name || ''}
          onConfirmBatch={handleBatchConfirm}
        />
      )}

      {/* Confirmation Modal to Approve & Lock Unit */}
      {isApproveModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Duyệt Chốt & Niêm Phong Dữ Liệu
              </h3>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  QUY ĐỊNH BẢO MẬT:
                </div>
                <p>
                  • Sau khi bấm <strong>"Duyệt Chốt"</strong>, dữ liệu của đơn vị{' '}
                  <strong>"{activeUnit.name}"</strong> sẽ được niêm phong vĩnh viễn.
                </p>
                <p>
                  • Không ai (kể cả quản trị viên và cán bộ xã) được sửa đổi điểm số này nữa để đảm bảo tính minh bạch và trung thực.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ý kiến thẩm định & Phê chuẩn của UBND:
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ghi chú thẩm định, thống nhất công nhận danh hiệu cho đơn vị..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprovalAndLock}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xác nhận Duyệt Chốt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
