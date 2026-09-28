import React, { useState } from 'react';
import { Building2, CheckCircle2, Edit2, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Commune } from '../../types';
import { getAdministrativeTerms } from '../../utils/administrativeTerms';

export const CommunesView: React.FC = () => {
  const {
    communes,
    selectedCommuneId,
    setSelectedCommuneId,
    addCommune,
    updateCommune,
    deleteCommune,
    allUnits,
    allHouseholds,
    allClans,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState<Commune | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    communeType: 'xa' as 'xa' | 'phuong' | 'thi_tran',
    district: 'Huyện Hòa Vang',
    province: 'TP. Đà Nẵng',
    leaderName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const openCreateModal = () => {
    setEditingCommune(null);
    setFormData({
      name: '',
      code: `xa-${Date.now().toString().slice(-4)}`,
      communeType: 'xa',
      district: 'Huyện Hòa Vang',
      province: 'TP. Đà Nẵng',
      leaderName: '',
      phone: '',
      email: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Commune) => {
    setEditingCommune(c);
    setFormData({
      name: c.name,
      code: c.code || '',
      communeType: c.communeType || (c.name.toLowerCase().includes('phường') ? 'phuong' : 'xa'),
      district: c.district || 'Huyện Hòa Vang',
      province: c.province || 'TP. Đà Nẵng',
      leaderName: c.leaderName || '',
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên Xã / Phường!');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || `commune-${Date.now()}`,
      communeType: formData.communeType,
      district: formData.district.trim(),
      province: formData.province.trim(),
      leaderName: formData.leaderName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim(),
    };

    if (editingCommune) {
      updateCommune(editingCommune.id, payload);
    } else {
      addCommune(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (communes.length <= 1) {
      alert('Hệ thống phải duy trì ít nhất một xã / phường!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn vị "${name}"? Tất cả dữ liệu liên quan có thể bị ảnh hưởng.`)) {
      deleteCommune(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quản lý Danh sách Xã / Phường (Đa địa bàn)
            </h2>
            <p className="text-xs text-slate-500">
              Thêm mới, chỉnh sửa thông tin hành chính các Xã, Phường, Thị trấn trực thuộc trong hệ thống
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm Xã / Phường mới
        </button>
      </div>

      {/* Communes Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {communes.map((c) => {
          const isSelected = selectedCommuneId === c.id;
          const terms = getAdministrativeTerms(c);
          const unitCount = allUnits.filter((u) => u.communeId === c.id).length;
          const householdCount = allHouseholds.filter((h) => h.communeId === c.id).length;
          const clanCount = allClans.filter((cl) => cl.communeId === c.id).length;

          return (
            <div
              key={c.id}
              className={`bg-white rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.communeType === 'phuong'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : c.communeType === 'thi_tran'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {c.communeType === 'phuong'
                          ? 'Phường'
                          : c.communeType === 'thi_tran'
                          ? 'Thị trấn'
                          : 'Xã'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-medium">
                        Mã: {c.code}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {c.name}
                    </h3>
                  </div>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-full border border-amber-300 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      Đang làm việc
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {c.district}, {c.province}
                    </span>
                  </div>
                  {c.leaderName && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        Lãnh đạo: {c.leaderName}
                      </span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="text-[11px] text-slate-500">
                      SĐT: <span className="font-semibold text-slate-700">{c.phone}</span>
                    </div>
                  )}
                </div>

                {/* Sub-counts */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-extrabold text-slate-800">{unitCount}</div>
                    <div className="text-[10px] text-slate-500">{terms.unitLabelPlural}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-extrabold text-slate-800">{householdCount}</div>
                    <div className="text-[10px] text-slate-500">Hộ dân</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-extrabold text-slate-800">{clanCount}</div>
                    <div className="text-[10px] text-slate-500">Dòng họ</div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                {!isSelected ? (
                  <button
                    onClick={() => setSelectedCommuneId(c.id)}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    Chuyển sang đơn vị này
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">Đang hoạt động</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(c)}
                    title="Chỉnh sửa thông tin"
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    title="Xóa xã/phường"
                    className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-amber-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingCommune ? 'Chỉnh sửa thông tin Xã / Phường' : 'Thêm Xã / Phường mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại đơn vị *
                  </label>
                  <select
                    value={formData.communeType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        communeType: e.target.value as 'xa' | 'phuong' | 'thi_tran',
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white cursor-pointer font-medium"
                  >
                    <option value="xa">Xã (Thuộc Huyện)</option>
                    <option value="phuong">Phường (Thuộc Quận/Thành phố)</option>
                    <option value="thi_tran">Thị trấn (Thuộc Huyện)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã định danh (Code)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    placeholder="VD: xa-hoa-khuong"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Xã / Phường / Thị trấn *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-semibold"
                  placeholder="VD: Xã Hòa Khương hoặc Phường Thạch Thang"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quận / Huyện *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="VD: Huyện Hòa Vang"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tỉnh / Thành phố *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="VD: TP. Đà Nẵng"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Người đứng đầu / Chủ tịch UBND
                </label>
                <input
                  type="text"
                  value={formData.leaderName}
                  onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="VD: Nguyễn Văn A - Chủ tịch UBND"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="VD: 0236.xxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email UBND</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="VD: ubnd@danang.gov.vn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  placeholder="Thông tin bổ sung..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition shadow-xs cursor-pointer"
                >
                  {editingCommune ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
