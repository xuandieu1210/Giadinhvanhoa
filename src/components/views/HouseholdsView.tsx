import React, { useState } from 'react';
import { Download, Edit2, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Household } from '../../types';
import { exportHouseholdsToExcel } from '../../utils/excel';
import { ImportExcelModal } from '../modals/ImportExcelModal';

export const HouseholdsView: React.FC = () => {
  const {
    households,
    units,
    clans,
    addHousehold,
    updateHousehold,
    deleteHousehold,
    importHouseholds,
    currentUser,
    scores,
    selectedPeriodId,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    headName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    birthYear: 1980,
    memberCount: 4,
    address: '',
    unitId: units[0]?.id || '',
    residentialCluster: 'Cụm 1',
    phone: '',
    notes: '',
  });

  // Distinct residential clusters for filter
  const distinctClusters = Array.from(
    new Set(households.map((h) => h.residentialCluster).filter(Boolean))
  ) as string[];

  const filteredHouseholds = households.filter((h) => {
    const matchesSearch =
      h.headName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.phone && h.phone.includes(searchTerm));
    const matchesUnit = selectedUnitFilter === 'all' || h.unitId === selectedUnitFilter;
    const matchesCluster =
      selectedClusterFilter === 'all' ||
      (h.residentialCluster || 'Chưa phân cụm') === selectedClusterFilter;

    return matchesSearch && matchesUnit && matchesCluster;
  });

  const openCreateModal = () => {
    setEditingHousehold(null);
    const defaultUnitId =
      currentUser?.role === 'to_truong' && currentUser.unitId ? currentUser.unitId : (units[0]?.id || '');
    setFormData({
      code: `HGĐ-${String(households.length + 1).padStart(3, '0')}`,
      headName: '',
      gender: 'Nam',
      birthYear: 1980,
      memberCount: 4,
      address: '',
      unitId: defaultUnitId,
      residentialCluster: 'Cụm 1',
      phone: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (h: Household) => {
    setEditingHousehold(h);
    setFormData({
      code: h.code,
      headName: h.headName,
      gender: h.gender,
      birthYear: h.birthYear || 1980,
      memberCount: h.memberCount,
      address: h.address,
      unitId: h.unitId,
      residentialCluster: h.residentialCluster || 'Cụm 1',
      phone: h.phone || '',
      notes: h.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.headName.trim() || !formData.code.trim()) {
      alert('Vui lòng nhập mã và tên chủ hộ!');
      return;
    }
    if (!formData.unitId) {
      alert('Vui lòng chọn Thôn / Tổ cho hộ gia đình!');
      return;
    }

    const unitObj = units.find((u) => u.id === formData.unitId);
    const unitName = unitObj ? unitObj.name : 'Chưa phân';

    const payload = {
      ...formData,
      unitName,
      residentialCluster: formData.residentialCluster?.trim() || 'Cụm 1',
    };

    if (editingHousehold) {
      updateHousehold(editingHousehold.id, payload);
    } else {
      addHousehold(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hộ "${name}"?`)) {
      deleteHousehold(id);
    }
  };

  // Clans available for selected unit in modal form
  const availableClans = clans.filter((c) => c.unitId === formData.unitId);

  const canManage =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'can_bo_xa' ||
    currentUser?.role === 'to_truong';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh mục Hộ Gia Đình</h2>
            <p className="text-xs text-slate-500">
              Quản lý danh sách hộ gia đình, nhân khẩu, tộc họ trực thuộc để bình xét Gia đình văn hóa
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportHouseholdsToExcel(filteredHouseholds)}
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
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Thêm Hộ mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên chủ hộ, địa chỉ, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
            />
          </div>

          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả Thôn/Tổ ({units.length})</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={selectedClusterFilter}
            onChange={(e) => setSelectedClusterFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả Cụm dân cư</option>
            {distinctClusters.map((cluster) => (
              <option key={cluster} value={cluster}>
                {cluster}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-600">
          Hiển thị: <strong className="text-slate-900">{filteredHouseholds.length}</strong> / {households.length} hộ
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">STT</th>
                <th className="p-3">Mã hộ</th>
                <th className="p-3">Chủ hộ</th>
                <th className="p-3 text-center">Nhân khẩu</th>
                <th className="p-3">Thôn / Tổ</th>
                <th className="p-3">Cụm dân cư</th>
                <th className="p-3">Địa chỉ & SĐT</th>
                <th className="p-3 text-center">Đợt xét này</th>
                <th className="p-3">Ghi chú</th>
                {canManage && <th className="p-3 text-center w-24">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredHouseholds.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 10 : 9} className="p-8 text-center text-slate-400">
                    Không tìm thấy hộ gia đình nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredHouseholds.map((hh, idx) => {
                  const sc = scores.find(
                    (s) => s.periodId === selectedPeriodId && s.targetType === 'household' && s.targetId === hh.id
                  );
                  return (
                    <tr key={hh.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{hh.code}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{hh.headName}</div>
                        <div className="text-[11px] text-slate-400">
                          {hh.gender}, sinh năm {hh.birthYear || '—'}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{hh.memberCount}</td>
                      <td className="p-3 text-slate-700">
                        {units.find((u) => u.id === hh.unitId)?.name || hh.unitName || 'Chưa phân'}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {hh.residentialCluster || 'Cụm 1'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800">{hh.address}</div>
                        {hh.phone && <div className="text-[11px] text-slate-500">{hh.phone}</div>}
                      </td>
                      <td className="p-3 text-center">
                        {sc ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              sc.isQualified
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {sc.finalScore}đ • {sc.isQualified ? 'Đạt chuẩn' : 'Chưa đạt'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Chưa chấm</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{hh.notes || '—'}</td>
                      {canManage && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(hh)}
                              title="Sửa hộ gia đình"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(hh.id, hh.headName)}
                              title="Xóa hộ gia đình"
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

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingHousehold ? 'Sửa thông tin Hộ gia đình' : 'Thêm mới Hộ gia đình'}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã hộ *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ tên Chủ hộ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.headName}
                    onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm sinh</label>
                  <input
                    type="number"
                    min="1920"
                    max="2020"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số nhân khẩu *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.memberCount}
                    onChange={(e) => setFormData({ ...formData, memberCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thôn / Tổ dân phố *
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cụm dân cư (Khu vực / Cụm) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cụm 1, Cụm 2, Cụm Trung tâm..."
                    value={formData.residentialCluster}
                    onChange={(e) => setFormData({ ...formData, residentialCluster: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hộ gia đình trực thuộc Cụm dân cư trong Thôn/Tổ (không cần thuộc tộc họ).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    required
                    placeholder="Số nhà, đường, xóm..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về hoàn cảnh, thành tích..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-xs"
                >
                  {editingHousehold ? 'Cập nhật' : 'Thêm mới'}
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
        type="household"
        onImportSuccess={(data) => {
          importHouseholds(data);
          alert(`Đã nhập thành công ${data.length} hộ gia đình từ file Excel!`);
        }}
      />
    </div>
  );
};
