import React, { useState } from 'react';
import { Download, Edit2, FileSpreadsheet, Home, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Unit } from '../../types';
import { exportUnitsToExcel } from '../../utils/excel';
import { ImportExcelModal } from '../modals/ImportExcelModal';

export const UnitsView: React.FC = () => {
  const {
    units,
    addUnit,
    updateUnit,
    deleteUnit,
    importUnits,
    getUnitProgress,
    selectedPeriodId,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    leaderName: '',
    leaderPhone: '',
    totalHouseholds: 100,
    totalPopulation: 400,
    notes: '',
  });

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.leaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingUnit(null);
    setFormData({
      code: `TDP-0${units.length + 1}`,
      name: `Tổ dân phố ${units.length + 1}`,
      leaderName: '',
      leaderPhone: '',
      totalHouseholds: 120,
      totalPopulation: 480,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      code: unit.code,
      name: unit.name,
      leaderName: unit.leaderName,
      leaderPhone: unit.leaderPhone,
      totalHouseholds: unit.totalHouseholds,
      totalPopulation: unit.totalPopulation,
      notes: unit.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Vui lòng nhập mã và tên thôn/tổ!');
      return;
    }

    if (editingUnit) {
      updateUnit(editingUnit.id, formData);
    } else {
      addUnit(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}"? Thao tác này không thể hoàn tác.`)) {
      deleteUnit(id);
    }
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'can_bo_xa';

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh mục Thôn / Tổ Dân Phố</h2>
              <p className="text-xs text-slate-500">
                Quản lý danh sách các đơn vị thôn, buôn, tổ dân phố trực thuộc xã/phường
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportUnitsToExcel(units)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất Excel (.xlsx)
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                Nhập Excel
              </button>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm shadow-red-700/20 transition"
              >
                <Plus className="w-4 h-4" />
                Thêm Thôn/Tổ mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã hoặc trưởng thôn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
          />
        </div>

        <div className="text-xs text-slate-600 flex items-center gap-4">
          <span>Tổng số đơn vị: <strong className="text-slate-900">{units.length}</strong></span>
          <span>Tổng số hộ: <strong className="text-slate-900">{units.reduce((acc, u) => acc + u.totalHouseholds, 0)}</strong></span>
          <span>Tổng nhân khẩu: <strong className="text-slate-900">{units.reduce((acc, u) => acc + u.totalPopulation, 0)}</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Mã đơn vị</th>
                <th className="p-3">Tên Thôn / Tổ dân phố</th>
                <th className="p-3">Trưởng thôn/tổ & SĐT</th>
                <th className="p-3 text-center">Số hộ</th>
                <th className="p-3 text-center">Nhân khẩu</th>
                <th className="p-3">Trạng thái đợt này</th>
                <th className="p-3">Ghi chú</th>
                {canManage && <th className="p-3 text-center w-24">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="p-8 text-center text-slate-400">
                    Không tìm thấy thôn/tổ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit, idx) => {
                  const prog = getUnitProgress(unit.id, selectedPeriodId);
                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{unit.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{unit.name}</td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{unit.leaderName || '—'}</div>
                        <div className="text-[11px] text-slate-400">{unit.leaderPhone}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {unit.totalHouseholds}
                      </td>
                      <td className="p-3 text-center text-slate-700">{unit.totalPopulation}</td>
                      <td className="p-3">
                        {prog.status === 'da_chot' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Đã chốt duyệt
                          </span>
                        ) : prog.status === 'da_gui' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            ↗ Đã gửi lên xã
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Chưa gửi
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{unit.notes || '—'}</td>
                      {canManage && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(unit)}
                              title="Sửa thông tin"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(unit.id, unit.name)}
                              title="Xóa thôn/tổ"
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-red-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingUnit ? 'Sửa thông tin Thôn / Tổ' : 'Thêm mới Thôn / Tổ Dân Phố'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã thôn/tổ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Thôn / Tổ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trưởng thôn / Tổ trưởng
                  </label>
                  <input
                    type="text"
                    value={formData.leaderName}
                    onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    value={formData.leaderPhone}
                    onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tổng số hộ gia đình
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalHouseholds}
                    onChange={(e) => setFormData({ ...formData, totalHouseholds: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tổng số nhân khẩu
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalPopulation}
                    onChange={(e) => setFormData({ ...formData, totalPopulation: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {editingUnit ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="unit"
        onImportSuccess={(data) => {
          importUnits(data);
          alert(`Đã nhập thành công ${data.length} thôn/tổ từ file Excel!`);
        }}
      />
    </div>
  );
};
