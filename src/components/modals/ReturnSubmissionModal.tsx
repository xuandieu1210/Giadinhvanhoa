import React, { useState } from 'react';
import { AlertCircle, RotateCcw, Send, X } from 'lucide-react';

interface ReturnSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'unit' | 'household';
  targetName: string;
  unitName?: string;
  onConfirm: (reason: string) => void;
}

export const ReturnSubmissionModal: React.FC<ReturnSubmissionModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetName,
  unitName,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const PRESET_REASONS = [
    'Hồ sơ chưa đầy đủ biên bản họp bình xét công khai toàn dân.',
    'Một số hộ gia đình có phản ánh vi phạm quy ước, nếp sống cần thẩm tra lại.',
    'Thiếu báo cáo thành tích và tài liệu minh chứng các chỉ tiêu chưa đạt.',
    'Chưa đối soát kỹ các tiêu chuẩn 2 và tiêu chuẩn 3 về trật tự môi trường.',
    'Tỷ lệ hộ đạt chuẩn chưa phù hợp với tình hình thực tế trên địa bàn.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do trả hồ sơ để Thôn/Tổ nắm rõ và chấm lại.');
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200">
                Thẩm quyền Cấp Xã / Phường
              </span>
              <h3 className="text-base font-bold text-white">
                Trả hồ sơ yêu cầu Tổ chấm lại
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Đối tượng trả về: <span className="text-red-700 font-bold">{targetName}</span>
                {unitName && <span className="text-slate-600"> (Thuộc {unitName})</span>}
              </p>
              <p className="text-amber-800 mt-1">
                Sau khi trả hồ sơ, Thôn/Tổ có thể mở lại hệ thống, rà soát và chấm lại điểm cho các hộ hoặc thôn tổ mình, sau đó gửi lại cho UBND xã/phường phê duyệt.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Chọn nhanh lý do yêu cầu chấm lại:
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setError('');
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition flex items-center gap-2 text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="line-clamp-1">{preset}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Chi tiết ý kiến chỉ đạo của UBND Xã / Phường: <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              placeholder="Nhập chi tiết các nội dung yêu cầu Thôn/Tổ phải rà soát, kiểm tra thực tế và chấm lại..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
            {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
          </div>

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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xác nhận trả hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
