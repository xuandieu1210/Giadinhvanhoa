import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckCircle,
  Clock,
  Download,
  Edit2,
  FileCheck,
  Info,
  Paperclip,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EvaluationPeriod, EvidenceFile } from '../../types';
import { PeriodDecisionModal } from '../modals/PeriodDecisionModal';

export const PeriodsView: React.FC = () => {
  const {
    periods,
    addPeriod,
    updatePeriod,
    deletePeriod,
    selectedPeriodId,
    setSelectedPeriodId,
    isPeriodExpired,
    selectedCommune,
    currentUser,
    updatePeriodDecisionFile,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | null>(null);
  const [decisionModalPeriod, setDecisionModalPeriod] = useState<EvaluationPeriod | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    status: 'active' as 'active' | 'upcoming' | 'closed',
    notes: '',
  });

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'can_bo_xa';

  const openCreateModal = () => {
    setEditingPeriod(null);
    const currYear = new Date().getFullYear();
    setFormData({
      name: `Bình xét Gia đình & Thôn Văn hóa năm ${currYear} - ${selectedCommune?.name || 'Cấp Xã'}`,
      year: currYear,
      startDate: `${currYear}-09-01`,
      endDate: `${currYear}-10-31`,
      status: 'active',
      notes: `UBND ${selectedCommune?.name || 'Xã'} triển khai bình xét phong trào Toàn dân đoàn kết xây dựng đời sống văn hóa.`,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: EvaluationPeriod) => {
    setEditingPeriod(p);
    setFormData({
      name: p.name,
      year: p.year,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      notes: p.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên đợt xét!');
      return;
    }

    if (editingPeriod) {
      updatePeriod(editingPeriod.id, formData);
    } else {
      addPeriod(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa đợt xét "${name}"?`)) {
      deletePeriod(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Quản lý Đợt Xét Văn Hóa</h2>
              {selectedCommune && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  {selectedCommune.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Xã/Phường chủ động xây dựng kế hoạch, tự tạo và quản lý các đợt bình xét văn hóa của đơn vị mình
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo đợt xét cho {selectedCommune?.name || 'Xã'}
          </button>
        )}
      </div>

      {/* Rules Notice */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          QUY ĐỊNH PHÂN CẤP & THỜI HẠN:
        </div>
        <p>
          • <strong>Phân cấp tự chủ:</strong> Mỗi Xã / Phường tự tạo các đợt xét duyệt cho mình dùng. Các Thôn / Tổ trực thuộc chỉ chấm điểm trong phạm vi đợt của xã mình.
        </p>
        <p>
          • <strong>Quy định thời hạn:</strong> Nếu ngày hiện tại vượt quá ngày kết thúc của đợt xét, <strong>tổ/thôn không được tiếp tục chấm điểm hoặc nộp mới</strong>.
        </p>
        <p>
          • Cán bộ Xã/Phường và Quản trị viên (Admin) vẫn có toàn quyền xem, duyệt chốt và xuất báo cáo dữ liệu lịch sử.
        </p>
      </div>

      {/* Periods Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {periods.map((p) => {
          const isSelected = selectedPeriodId === p.id;
          const expired = isPeriodExpired(p);

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-red-600 ring-2 ring-red-600/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xl font-black text-slate-900">{p.year}</span>
                  <div>
                    {expired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <Clock className="w-3 h-3" /> Đã kết thúc / Hết hạn
                      </span>
                    ) : p.status === 'upcoming' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Sắp diễn ra
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Đang diễn ra
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mb-3">{p.name}</h3>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngày bắt đầu:</span>
                    <strong className="text-slate-700">{p.startDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngày kết thúc:</span>
                    <strong className={expired ? 'text-rose-700' : 'text-slate-700'}>
                      {p.endDate}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trạng thái cấu hình:</span>
                    <span className="font-medium text-slate-800 capitalize">{p.status}</span>
                  </div>
                  {p.notes && (
                    <div className="text-[11px] text-slate-500 pt-1 italic line-clamp-2">
                      {p.notes}
                    </div>
                  )}

                  {/* Decision info of this period */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px]">
                      <FileCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {p.decisionNumber ? (
                        <span className="font-bold text-emerald-800 font-mono">
                          QĐ: {p.decisionNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa có QĐ công nhận</span>
                      )}
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setDecisionModalPeriod(p)}
                        className="text-[11px] text-red-700 hover:text-red-900 font-bold hover:underline cursor-pointer"
                      >
                        {p.decisionNumber ? 'Xem/Sửa QĐ' : 'Ban hành QĐ'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPeriodId(p.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-700 text-white cursor-default shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  {isSelected ? 'Đang làm việc' : 'Chọn đợt này'}
                </button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      title="Sửa thông tin đợt xét"
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {periods.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Xóa đợt xét"
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Period */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-red-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingPeriod ? 'Sửa thông tin Đợt xét' : 'Tạo mới Đợt xét Văn hóa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên đợt bình xét *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm xét *</label>
                  <input
                    type="number"
                    min="2000"
                    max="2099"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  >
                    <option value="active">Đang diễn ra (active)</option>
                    <option value="upcoming">Sắp diễn ra (upcoming)</option>
                    <option value="closed">Đã đóng / Kết thúc (closed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày kết thúc (Hạn chót) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú hướng dẫn</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Văn bản quy định, hướng dẫn mốc nộp..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition shadow-xs"
                >
                  {editingPeriod ? 'Cập nhật' : 'Tạo đợt xét'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Period Decision Modal */}
      {decisionModalPeriod && (
        <PeriodDecisionModal
          isOpen={!!decisionModalPeriod}
          onClose={() => setDecisionModalPeriod(null)}
          period={decisionModalPeriod}
          communeName={selectedCommune?.name || 'Xã / Phường'}
          onSaveDecision={(data) => {
            const res = updatePeriodDecisionFile(decisionModalPeriod.id, data);
            alert(res.message);
          }}
          readOnly={!canManage}
        />
      )}
    </div>
  );
};
