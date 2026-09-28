import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CriteriaScoreMap, EvaluationScoreItem, EvidenceFile } from '../../types';
import { EvidenceFileManager } from '../common/EvidenceFileManager';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'household' | 'unit' | 'clan';
  targetId: string;
  targetName: string;
  unitId: string;
  unitName: string;
  periodId: string;
  initialScore?: EvaluationScoreItem;
  readOnly?: boolean;
  onSave: (scoreData: {
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
    isExemplary?: boolean;
    hasViolation?: boolean;
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }) => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  unitId,
  unitName,
  periodId,
  initialScore,
  readOnly = false,
  onSave,
}) => {
  const { criteria, bonusCategories, penaltyCategories, selectedCommune, getScoringStandards } = useApp();

  // Vùng miền quyết định bộ tiêu chí/điểm tối đa áp dụng (đồng bằng, đô thị hoặc miền núi, DTTS)
  const regionType = selectedCommune?.regionType || 'dong_bang';
  const standards = useMemo(
    () => getScoringStandards(targetType, regionType),
    [targetType, regionType, criteria]
  );
  const totalMaxPoints = useMemo(
    () => standards.reduce((sum, s) => sum + s.maxPoints, 0) || 100,
    [standards]
  );

  const [scoreValues, setScoreValues] = useState<CriteriaScoreMap>({});
  const [itemScores, setItemScores] = useState<Record<string, number>>({});
  // Chấm chi tiết từng tiêu chí thành phần (mặc định) hoặc chấm nhanh theo tổng mỗi tiêu chuẩn
  const [isDetailedMode, setIsDetailedMode] = useState<boolean>(true);
  const [bonus, setBonus] = useState<number>(initialScore?.bonusPoints ?? 1);
  const [penalty, setPenalty] = useState<number>(initialScore?.penaltyPoints ?? 0);
  const [comments, setComments] = useState<string>(initialScore?.comments ?? '');

  // New fields
  const [isExemplary, setIsExemplary] = useState<boolean>(initialScore?.isExemplary ?? false);
  const [hasViolation, setHasViolation] = useState<boolean>(
    initialScore?.hasViolation ?? ((initialScore?.penaltyPoints ?? 0) > 0)
  );
  const [violationDetails, setViolationDetails] = useState<string>(
    initialScore?.violationDetails ?? ''
  );
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(
    initialScore?.evidenceFiles ?? []
  );

  // Toggle category pickers
  const [showBonusPicker, setShowBonusPicker] = useState(false);
  const [showPenaltyPicker, setShowPenaltyPicker] = useState(false);
  const [showCriteriaDetail, setShowCriteriaDetail] = useState(false);

  // Nạp lại toàn bộ phiếu mỗi khi đổi đối tượng chấm (hộ/thôn khác) hoặc đổi bộ tiêu chuẩn áp dụng
  useEffect(() => {
    const initialStd: CriteriaScoreMap = {};
    const initialItems: Record<string, number> = {};
    standards.forEach((std) => {
      const existingStdScore = initialScore?.criteriaScores?.[std.key];
      const ratio =
        existingStdScore !== undefined && std.maxPoints > 0 ? existingStdScore / std.maxPoints : 0.93;
      initialStd[std.key] = existingStdScore !== undefined ? existingStdScore : Math.round(std.maxPoints * 0.93);
      std.items.forEach((item) => {
        const existingItemScore = initialScore?.itemScores?.[item.id];
        initialItems[item.id] =
          existingItemScore !== undefined ? existingItemScore : Math.round(item.maxPoints * ratio);
      });
    });
    setScoreValues(initialStd);
    setItemScores(initialItems);
    setIsDetailedMode(true);
    setBonus(initialScore?.bonusPoints ?? 1);
    setPenalty(initialScore?.penaltyPoints ?? 0);
    setComments(initialScore?.comments ?? '');
    setIsExemplary(initialScore?.isExemplary ?? false);
    setHasViolation(initialScore?.hasViolation ?? ((initialScore?.penaltyPoints ?? 0) > 0));
    setViolationDetails(initialScore?.violationDetails ?? '');
    setEvidenceFiles(initialScore?.evidenceFiles ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, periodId, standards, initialScore]);

  if (!isOpen) return null;

  const getStandardTotal = (stdKey: string, items: { id: string }[]) =>
    items.reduce((sum, it) => sum + (itemScores[it.id] || 0), 0);

  const totalStandard = isDetailedMode
    ? standards.reduce((sum, std) => sum + getStandardTotal(std.key, std.items), 0)
    : Object.values(scoreValues).reduce((sum, v) => sum + (v || 0), 0);
  const finalScore = Math.max(0, Math.min(100, totalStandard + bonus - penalty));
  // Ngưỡng đạt chuẩn: từ 90 điểm trở lên
  const isQualified = finalScore >= 90;

  // Chuyển đổi qua lại giữa chấm chi tiết từng tiêu chí và chấm nhanh theo tổng tiêu chuẩn
  const handleToggleDetailedMode = () => {
    if (isDetailedMode) {
      const nextStd: CriteriaScoreMap = {};
      standards.forEach((std) => {
        nextStd[std.key] = getStandardTotal(std.key, std.items);
      });
      setScoreValues(nextStd);
    } else {
      const nextItems: Record<string, number> = {};
      standards.forEach((std) => {
        const total = scoreValues[std.key] ?? 0;
        const ratio = std.maxPoints > 0 ? total / std.maxPoints : 0;
        std.items.forEach((item) => {
          nextItems[item.id] = Math.round(item.maxPoints * ratio);
        });
      });
      setItemScores(nextItems);
    }
    setIsDetailedMode((prev) => !prev);
  };

  const handleApplyPresetPass = () => {
    const presetItems: Record<string, number> = {};
    const presetStd: CriteriaScoreMap = {};
    standards.forEach((std) => {
      let sum = 0;
      std.items.forEach((item) => {
        const v = Math.round(item.maxPoints * 0.97);
        presetItems[item.id] = v;
        sum += v;
      });
      presetStd[std.key] = sum;
    });
    setItemScores(presetItems);
    setScoreValues(presetStd);
    setBonus(1);
    setPenalty(0);
    setHasViolation(false);
    setComments('Chấp hành tốt mọi chủ trương, gia đình văn hóa tiêu biểu.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const criteriaScoresOut: CriteriaScoreMap = {};
    standards.forEach((std) => {
      criteriaScoresOut[std.key] = isDetailedMode
        ? getStandardTotal(std.key, std.items)
        : scoreValues[std.key] || 0;
    });
    onSave({
      periodId,
      targetType,
      targetId,
      targetName,
      unitId,
      unitName,
      criteriaScores: criteriaScoresOut,
      itemScores: isDetailedMode ? itemScores : undefined,
      bonusPoints: Number(bonus),
      penaltyPoints: Number(penalty),
      comments,
      isExemplary: targetType === 'household' ? isExemplary : false,
      hasViolation: hasViolation || !isQualified || penalty > 0,
      violationDetails: hasViolation || !isQualified ? violationDetails : undefined,
      evidenceFiles,
    });
    onClose();
  };

  const getTargetTypeLabel = () => {
    if (targetType === 'household') return 'Hộ Gia Đình';
    if (targetType === 'clan') return 'Dòng Họ / Tộc Họ';
    return 'Thôn / Tổ Dân Phố';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-amber-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-400 text-red-900 rounded-lg shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-200 font-semibold">
                Phiếu chấm điểm {getTargetTypeLabel()}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">{targetName}</h3>
              <p className="text-xs text-red-100 mt-0.5">Thuộc đơn vị: {unitName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Returned for revision notice */}
          {initialScore?.returnStatus === 'returned_for_revision' && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-950 uppercase tracking-wide">
                  UBND Xã/Phường đã trả hồ sơ hộ này - Yêu cầu rà soát và chấm lại:
                </span>
                <p className="mt-1 text-rose-800 font-medium italic">
                  "{initialScore.returnReason || 'Cần thẩm tra lại các tiêu chuẩn chưa đạt hoặc có vi phạm.'}"
                </p>
                <p className="mt-1 text-[11px] text-rose-600">
                  Tổ trưởng vui lòng cập nhật lại điểm số, bổ sung tài liệu giải trình hoặc minh chứng vi phạm, sau đó lưu lại.
                </p>
              </div>
            </div>
          )}

          {readOnly && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Dữ liệu ở chế độ <strong>chỉ xem</strong> do đơn vị đã gửi hoặc đã được duyệt chốt.</span>
            </div>
          )}

          {/* Gia đình văn hóa tiêu biểu selection */}
          {targetType === 'household' && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 transition">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition ${
                    isExemplary ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Bình chọn Gia đình Văn hóa Tiêu biểu</span>
                    {isExemplary && (
                      <span className="text-[10px] font-bold px-2 py-0.2 bg-amber-200 text-amber-900 rounded-full">
                        ĐÃ CHỌN TIÊU BIỂU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dành cho các hộ gia đình đạt chuẩn cao (≥ 95 điểm), có nhiều thành tích và đóng góp xuất sắc.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={isExemplary}
                  onChange={(e) => setIsExemplary(e.target.checked)}
                  disabled={readOnly}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          )}

          {/* Quick preset button */}
          {!readOnly && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-medium text-slate-500">Mẫu chấm nhanh:</span>
              <button
                type="button"
                onClick={handleApplyPresetPass}
                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-md hover:bg-emerald-100 transition font-medium flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Điền mẫu đạt chuẩn (~97%)
              </button>
            </div>
          )}

          {/* Tiêu chuẩn chấm điểm - đúng bộ tiêu chí theo loại đối tượng & vùng miền của xã/phường */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 flex-wrap gap-2">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Bảng điểm theo {standards.length} tiêu chuẩn (Quy chuẩn {totalMaxPoints} điểm)
              </h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleDetailedMode}
                  className="text-xs text-red-700 hover:text-red-900 font-semibold flex items-center gap-1 cursor-pointer"
                  title={isDetailedMode ? 'Chuyển sang nhập nhanh tổng mỗi tiêu chuẩn' : 'Chuyển sang chấm chi tiết từng tiêu chí thành phần'}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDetailedMode ? 'Chấm chi tiết (đang bật)' : 'Chấm nhanh theo tổng'}</span>
                </button>
                {!isDetailedMode && (
                  <button
                    type="button"
                    onClick={() => setShowCriteriaDetail(!showCriteriaDetail)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{showCriteriaDetail ? 'Thu gọn tiêu chí' : 'Xem tiêu chí chi tiết'}</span>
                    {showCriteriaDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>

            {!isDetailedMode && showCriteriaDetail && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Danh mục tiêu chí thành phần đang áp dụng ({regionType === 'mien_nui' ? 'Miền núi, DTTS' : 'Đồng bằng, đô thị'}):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {standards.flatMap((std) => std.items).map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded border border-blue-100 text-[11px]">
                      <span className="font-mono font-bold text-blue-700 mr-1.5">[{c.code}]</span>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="ml-1 text-blue-600 font-bold">({c.maxPoints}đ)</span>
                      {c.description && (
                        <div className="text-slate-500 text-[10px] mt-0.5 line-clamp-1">
                          {c.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {standards.map((std, idx) => {
              const stdTotal = getStandardTotal(std.key, std.items);
              return (
                <div key={std.key} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="text-sm">
                      <span className="font-semibold text-slate-800">Tiêu chuẩn {idx + 1}:</span> {std.label}
                      <span className="block text-xs text-slate-500 mt-0.5">(Tối đa: {std.maxPoints} điểm)</span>
                    </div>
                    {isDetailedMode ? (
                      <div className="text-right shrink-0">
                        <div className="text-lg font-extrabold text-slate-800">
                          {stdTotal}<span className="text-xs font-normal text-slate-500">/{std.maxPoints}đ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max={std.maxPoints}
                          disabled={readOnly}
                          value={scoreValues[std.key] ?? 0}
                          onChange={(e) => {
                            const v = Math.min(std.maxPoints, Math.max(0, Number(e.target.value)));
                            setScoreValues((prev) => ({ ...prev, [std.key]: v }));
                          }}
                          className="w-20 px-2.5 py-1.5 text-center font-bold text-slate-800 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white text-base disabled:bg-slate-100"
                        />
                        <span className="text-xs text-slate-500">/ {std.maxPoints}đ</span>
                      </div>
                    )}
                  </div>

                  {isDetailedMode && (
                    <div className="divide-y divide-slate-200/70 pt-1">
                      {std.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 py-1.5 first:pt-0">
                          <div className="text-xs text-slate-600 flex-1 pr-2">
                            <span className="font-mono text-[10px] text-slate-400 mr-1">[{item.code}]</span>
                            {item.name}
                            {item.description && (
                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max={item.maxPoints}
                              disabled={readOnly}
                              value={itemScores[item.id] ?? 0}
                              onChange={(e) => {
                                const v = Math.min(item.maxPoints, Math.max(0, Number(e.target.value)));
                                setItemScores((prev) => ({ ...prev, [item.id]: v }));
                              }}
                              className="w-16 px-2 py-1 text-center text-sm font-semibold text-slate-800 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white disabled:bg-slate-100"
                            />
                            <span className="text-[11px] text-slate-400">/{item.maxPoints}đ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Điểm cộng và Điểm trừ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* BONUS SECTION */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Điểm cộng thưởng (+)
                </label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setShowBonusPicker(!showBonusPicker)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                  >
                    {showBonusPicker ? 'Ẩn danh mục' : 'Chọn từ danh mục'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  disabled={readOnly}
                  value={bonus}
                  onChange={(e) => setBonus(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2.5 py-1.5 text-center font-bold text-emerald-700 border border-emerald-300 rounded-md bg-white disabled:bg-slate-100 text-base"
                />
                <span className="text-xs text-emerald-800 font-medium">Thành tích đột xuất, gương mẫu, khen thưởng</span>
              </div>

              {/* Bonus Picker Dropdown */}
              {showBonusPicker && !readOnly && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 space-y-1.5 max-h-40 overflow-y-auto">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                    Nhấp để áp dụng điểm cộng & thêm vào nhận xét:
                  </div>
                  {bonusCategories
                    .filter(
                      (b) =>
                        (b.applicableTarget === 'all' || b.applicableTarget === targetType) &&
                        (!b.regionType || b.regionType === regionType)
                    )
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setBonus((prev) => prev + item.points);
                          const note = `+${item.points}đ (${item.title})`;
                          setComments((prev) => (prev ? `${prev}; ${note}` : note));
                        }}
                        className="w-full text-left p-1.5 bg-white hover:bg-emerald-100/60 rounded border border-emerald-100 text-[11px] text-slate-800 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="line-clamp-1 pr-1">{item.title}</span>
                        <span className="shrink-0 font-bold text-emerald-700">+{item.points}đ</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* PENALTY SECTION */}
            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Điểm trừ vi phạm (-)
                </label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setShowPenaltyPicker(!showPenaltyPicker)}
                    className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                  >
                    {showPenaltyPicker ? 'Ẩn danh mục' : 'Chọn từ danh mục'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  disabled={readOnly}
                  value={penalty}
                  onChange={(e) => setPenalty(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2.5 py-1.5 text-center font-bold text-rose-700 border border-rose-300 rounded-md bg-white disabled:bg-slate-100 text-base"
                />
                <span className="text-xs text-rose-800 font-medium">Vi phạm nếp sống, trật tự ATGT, môi trường</span>
              </div>

              {/* Penalty Picker Dropdown */}
              {showPenaltyPicker && !readOnly && (
                <div className="mt-2 pt-2 border-t border-rose-200/60 space-y-1.5 max-h-40 overflow-y-auto">
                  <div className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">
                    Nhấp để áp dụng điểm trừ & thêm vào nhận xét:
                  </div>
                  {penaltyCategories
                    .filter(
                      (p) =>
                        (p.applicableTarget === 'all' || p.applicableTarget === targetType) &&
                        (!p.regionType || p.regionType === regionType)
                    )
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPenalty((prev) => prev + item.points);
                          const note = `-${item.points}đ (${item.title})`;
                          setComments((prev) => (prev ? `${prev}; ${note}` : note));
                        }}
                        className="w-full text-left p-1.5 bg-white hover:bg-rose-100/60 rounded border border-rose-100 text-[11px] text-slate-800 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="line-clamp-1 pr-1">{item.title}</span>
                        <span className="shrink-0 font-bold text-rose-700">-{item.points}đ</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nhận xét / Đánh giá của ban bình xét:
            </label>
            <textarea
              rows={2}
              disabled={readOnly}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Nhập ghi chú hoặc ý kiến đánh giá chi tiết..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden disabled:bg-slate-100"
            />
          </div>

          {/* Violation and Evidence Files Section */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                  Hồ sơ minh chứng đối với hộ vi phạm / chưa đạt chuẩn
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 text-xs text-rose-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasViolation || !isQualified || penalty > 0}
                  onChange={(e) => setHasViolation(e.target.checked)}
                  disabled={readOnly || !isQualified || penalty > 0}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold">Khai báo có vi phạm</span>
              </label>
            </div>

            {(hasViolation || !isQualified || penalty > 0 || evidenceFiles.length > 0) && (
              <div className="space-y-3 pt-2 border-t border-rose-200/80">
                <div>
                  <label className="block text-[11px] font-bold text-rose-900 uppercase tracking-wider mb-1">
                    Chi tiết hành vi vi phạm / lý do không đạt:
                  </label>
                  <textarea
                    rows={2}
                    disabled={readOnly}
                    value={violationDetails}
                    onChange={(e) => setViolationDetails(e.target.value)}
                    placeholder="Mô tả cụ thể hành vi vi phạm (xả rác, ô nhiễm, tranh chấp, tệ nạn, vi phạm an ninh trật tự hoặc pháp luật)..."
                    className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <EvidenceFileManager
                  files={evidenceFiles}
                  onChange={setEvidenceFiles}
                  readOnly={readOnly}
                  category="vi_pham"
                  templateType="vi_pham"
                  title="Tệp minh chứng vi phạm (Biên bản xử phạt, ảnh hiện trường...)"
                  description="Bắt buộc đối với các hộ không đạt hoặc có xử lý kỷ luật/vi phạm quy ước"
                />
              </div>
            )}
          </div>

          {/* Result Box */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isQualified ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Tính toán kết quả
              </div>
              <div className="text-sm font-medium">
                Tổng tiêu chuẩn: <strong>{totalStandard}đ</strong> | Cộng: <strong>+{bonus}đ</strong> | Trừ: <strong>-{penalty}đ</strong>
              </div>
              <div className="text-xs text-slate-500">
                Quy định: Điểm cuối từ <strong>90 điểm trở lên</strong> là đạt chuẩn văn hóa.
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-3xl font-extrabold tracking-tight">
                {finalScore} <span className="text-base font-normal text-slate-600">/ 100đ</span>
              </div>
              <div className="mt-1">
                {isQualified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ĐẠT CHUẨN VĂN HÓA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white shadow-xs">
                    CHƯA ĐẠT CHUẨN (&lt; 90đ)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Đóng
            </button>
            {!readOnly && (
              <button
                type="submit"
                className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition shadow-md flex items-center gap-2 cursor-pointer ${
                  initialScore?.returnStatus === 'returned_for_revision'
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 shadow-rose-600/25 ring-2 ring-amber-400'
                    : 'bg-red-700 hover:bg-red-800 shadow-red-700/20'
                }`}
              >
                {initialScore?.returnStatus === 'returned_for_revision' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Lưu kết quả chấm lại
                  </>
                ) : (
                  'Lưu kết quả chấm điểm'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
