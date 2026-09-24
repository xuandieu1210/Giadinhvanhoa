import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  FileCheck,
  FileText,
  UserCheck,
  X,
} from 'lucide-react';
import { EvaluationPeriod, EvidenceFile } from '../../types';
import { EvidenceFileManager } from '../common/EvidenceFileManager';

interface PeriodDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: EvaluationPeriod;
  communeName: string;
  onSaveDecision: (data: {
    decisionNumber: string;
    decisionDate: string;
    decisionSigner: string;
    decisionFile?: EvidenceFile;
    isFinalized?: boolean;
  }) => void;
  readOnly?: boolean;
}

export const PeriodDecisionModal: React.FC<PeriodDecisionModalProps> = ({
  isOpen,
  onClose,
  period,
  communeName,
  onSaveDecision,
  readOnly = false,
}) => {
  const [decisionNumber, setDecisionNumber] = useState(period.decisionNumber || '');
  const [decisionDate, setDecisionDate] = useState(
    period.decisionDate || new Date().toISOString().substring(0, 10)
  );
  const [decisionSigner, setDecisionSigner] = useState(
    period.decisionSigner || `Chủ tịch UBND ${communeName}`
  );
  const [decisionFiles, setDecisionFiles] = useState<EvidenceFile[]>(
    period.decisionFile ? [period.decisionFile] : []
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDecision({
      decisionNumber: decisionNumber.trim(),
      decisionDate,
      decisionSigner: decisionSigner.trim(),
      decisionFile: decisionFiles[0] || undefined,
      isFinalized: true,
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
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                UBND {communeName}
              </span>
              <h3 className="text-base font-bold text-white">
                Quyết định công nhận danh hiệu Văn hóa
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2.5">
            <Award className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">{period.name} (Năm {period.year})</p>
              <p className="text-slate-600 mt-0.5">
                Sau khi thẩm định và chốt toàn bộ dữ liệu các Thôn/Tổ dân phố, UBND Xã/Phường ban hành Quyết định công nhận danh hiệu Gia đình văn hóa, Thôn/Tổ dân phố văn hóa và Dòng họ văn hóa kèm theo tệp số hóa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số quyết định: <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  disabled={readOnly}
                  value={decisionNumber}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  placeholder="Ví dụ: 186/QĐ-UBND"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày ban hành quyết định: <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="date"
                  required
                  disabled={readOnly}
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Người ký quyết định / Chức vụ: <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                disabled={readOnly}
                value={decisionSigner}
                onChange={(e) => setDecisionSigner(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Hải - Chủ tịch UBND"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          {/* Decision File uploader */}
          <div className="pt-2 border-t border-slate-200">
            <EvidenceFileManager
              files={decisionFiles}
              onChange={(files) => setDecisionFiles(files.slice(-1))} // keep latest 1
              readOnly={readOnly}
              category="quyet_dinh"
              templateType="quyet_dinh"
              title="File số hóa Quyết định công nhận của UBND"
              description="Tải lên tệp PDF hoặc Word có dấu đỏ và chữ ký số chính thức"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Đóng
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow-md shadow-red-700/20 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Lưu Quyết định công nhận
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
