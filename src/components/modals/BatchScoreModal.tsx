import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  FileText,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { EvidenceFile, Household } from '../../types';
import { EvidenceFileManager } from '../common/EvidenceFileManager';

interface BatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHouseholds: Household[];
  unitName: string;
  periodName: string;
  onConfirmBatch: (data: {
    mode: 'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation';
    violationDetails?: string;
    evidenceFiles?: EvidenceFile[];
  }) => void;
}

export const BatchScoreModal: React.FC<BatchScoreModalProps> = ({
  isOpen,
  onClose,
  selectedHouseholds,
  unitName,
  periodName,
  onConfirmBatch,
}) => {
  const [mode, setMode] = useState<
    'pass_90' | 'pass_95' | 'pass_100' | 'set_exemplary' | 'clear_exemplary' | 'violation'
  >('pass_90');
  const [violationDetails, setViolationDetails] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmBatch({
      mode,
      violationDetails: mode === 'violation' ? violationDetails : undefined,
      evidenceFiles: mode === 'violation' ? evidenceFiles : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-amber-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-red-900 rounded-lg shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                Thao tác nhanh hàng loạt
              </span>
              <h3 className="text-base font-bold text-white">
                Chấm nhanh cho {selectedHouseholds.length} Hộ gia đình
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Unit & Period context */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Đơn vị:</span> {unitName}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Đợt xét:</span> {periodName}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chọn hành động chấm nhanh:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => setMode('pass_90')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  mode === 'pass_90'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    mode === 'pass_90' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Đạt chuẩn Cơ bản (90đ)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Tất cả 4 tiêu chuẩn đạt chuẩn, đủ điều kiện công nhận GĐVH.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setMode('pass_95')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  mode === 'pass_95'
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Award
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    mode === 'pass_95' ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Đạt loại Tốt (95đ)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Các tiêu chuẩn đạt điểm cao, gương mẫu chấp hành.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setMode('set_exemplary')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  mode === 'set_exemplary'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Star
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    mode === 'set_exemplary' ? 'text-amber-600 fill-amber-500' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Chọn GĐVH Tiêu biểu</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Gia đình văn hóa tiêu biểu xuất sắc được đề nghị khen thưởng.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setMode('violation')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  mode === 'violation'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    mode === 'violation' ? 'text-rose-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">Khai báo Vi phạm / Không đạt</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Trừ điểm vi phạm (&lt; 90đ), yêu cầu đính kèm tài liệu minh chứng.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Violation Details & Evidence File if mode is violation */}
          {mode === 'violation' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Nội dung vi phạm & Tệp minh chứng cho các hộ đã chọn</span>
              </div>
              <textarea
                value={violationDetails}
                onChange={(e) => setViolationDetails(e.target.value)}
                placeholder="Nhập chi tiết hành vi vi phạm quy ước, vi phạm nếp sống, vệ sinh môi trường, an ninh trật tự..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <EvidenceFileManager
                files={evidenceFiles}
                onChange={setEvidenceFiles}
                category="vi_pham"
                templateType="vi_pham"
                title="Minh chứng vi phạm áp dụng cho các hộ"
                description="Đính kèm biên bản xử phạt, trích lục vi phạm quy ước, ảnh hiện trường..."
              />
            </div>
          )}

          {/* Selected households chips */}
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Danh sách các hộ sẽ được áp dụng ({selectedHouseholds.length} hộ):</span>
            </div>
            <div className="max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-1.5">
              {selectedHouseholds.map((hh) => (
                <span
                  key={hh.id}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white text-slate-700 border border-slate-200 rounded-md shadow-2xs"
                >
                  {hh.code} - {hh.headName}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow-md shadow-red-700/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Áp dụng cho {selectedHouseholds.length} hộ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
