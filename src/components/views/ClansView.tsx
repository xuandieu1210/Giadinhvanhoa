import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileCheck,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Clan, ClanCulturalStatus } from '../../types';
import { exportClansToExcel } from '../../utils/excel';
import { ImportExcelModal } from '../modals/ImportExcelModal';

export const ClansView: React.FC = () => {
  const {
    clans,
    units,
    addClan,
    updateClan,
    deleteClan,
    importClans,
    currentUser,
    selectedCommune,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClan, setEditingClan] = useState<Clan | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unitId: units[0]?.id || '',
    patriarchName: '',
    patriarchPhone: '',
    totalHouseholds: 20,
    culturalStatus: 'dat_chuan' as ClanCulturalStatus,
    recognitionYear: new Date().getFullYear(),
    decisionNumber: '',
    notes: '',
  });

  const filteredClans = clans.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patriarchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = selectedUnitFilter === 'all' || c.unitId === selectedUnitFilter;
    const matchesStatus =
      selectedStatusFilter === 'all' || (c.culturalStatus || 'chua_cong_nhan') === selectedStatusFilter;
    return matchesSearch && matchesUnit && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingClan(null);
    const currYear = new Date().getFullYear();
    setFormData({
      code: `TOC-0${clans.length + 1}`,
      name: '',
      unitId: currentUser?.role === 'to_truong' && currentUser.unitId ? currentUser.unitId : (units[0]?.id || ''),
      patriarchName: '',
      patriarchPhone: '',
      totalHouseholds: 20,
      culturalStatus: 'dat_chuan',
      recognitionYear: currYear,
      decisionNumber: `QĐ số ${100 + clans.length + 1}/QĐ-UBND`,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (clan: Clan) => {
    setEditingClan(clan);
    setFormData({
      code: clan.code,
      name: clan.name,
      unitId: clan.unitId,
      patriarchName: clan.patriarchName,
      patriarchPhone: clan.patriarchPhone || '',
      totalHouseholds: clan.totalHouseholds,
      culturalStatus: clan.culturalStatus || 'chua_cong_nhan',
      recognitionYear: clan.recognitionYear || new Date().getFullYear(),
      decisionNumber: clan.decisionNumber || '',
      notes: clan.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Vui lòng nhập mã và tên tộc họ!');
      return;
    }

    const unitObj = units.find((u) => u.id === formData.unitId);
    const unitName = unitObj ? unitObj.name : 'Chưa phân';

    if (editingClan) {
      updateClan(editingClan.id, {
        ...formData,
        unitName,
      });
    } else {
      addClan({
        ...formData,
        unitName,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${name}"?`)) {
      deleteClan(id);
    }
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'can_bo_xa' || currentUser?.role === 'to_truong';

  const getStatusBadge = (status?: ClanCulturalStatus) => {
    switch (status) {
      case 'dat_chuan':
        return {
          label: 'Đã công nhận Dòng họ VH',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'dang_tham_tra':
        return {
          label: 'Đang thẩm tra hồ sơ',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
        };
      default:
        return {
          label: 'Chưa công nhận',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: Award,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Quản lý Dòng Họ / Tộc Họ Văn Hóa</h2>
              {selectedCommune && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {selectedCommune.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Xã/Phường trực tiếp nhập và quản lý danh sách dòng họ, ra quyết định công nhận danh hiệu văn hóa (không tổ chức chấm điểm cơ sở)
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportClansToExcel(filteredClans)}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất Excel (.xlsx)
          </button>

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                Nhập Excel
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Tộc họ mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Guidance Card for Multi-commune Clan recognition */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold">Cơ chế quản lý Tộc họ Văn hóa cấp Xã / Phường:</strong>
          <p className="text-amber-900 leading-relaxed">
            Theo quy định của phong trào đời sống văn hóa, danh hiệu <strong>Tộc họ văn hóa / Dòng họ hiếu học</strong> do 
            UBND cấp Xã/Phường trực tiếp tiếp nhận hồ sơ gia phả, họp xét thẩm tra và ban hành Quyết định công nhận. 
            Cấp Thôn / Tổ không phải tổ chức chấm điểm cho tộc họ mà chỉ tham gia xác nhận thông tin cơ sở khi cần.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên tộc, trưởng tộc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
            />
          </div>

          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả thôn/tổ ({units.length})</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả trạng thái công nhận</option>
            <option value="dat_chuan">✓ Đã công nhận Dòng họ VH</option>
            <option value="dang_tham_tra">⏳ Đang thẩm tra hồ sơ</option>
            <option value="chua_cong_nhan">○ Chưa công nhận</option>
          </select>
        </div>

        <div className="text-xs text-slate-600">
          Tổng số tộc họ: <strong className="text-slate-900">{filteredClans.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Mã Tộc</th>
                <th className="p-3">Tên Tộc họ</th>
                <th className="p-3">Thuộc Thôn / Tổ</th>
                <th className="p-3">Trưởng tộc & SĐT</th>
                <th className="p-3 text-center">Số hộ</th>
                <th className="p-3 text-center">Trạng thái công nhận</th>
                <th className="p-3">Quyết định / Năm</th>
                <th className="p-3">Ghi chú</th>
                {canManage && <th className="p-3 text-center w-24">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredClans.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 10 : 9} className="p-8 text-center text-slate-400">
                    Không có thông tin tộc họ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredClans.map((clan, idx) => {
                  const statusInfo = getStatusBadge(clan.culturalStatus);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={clan.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{clan.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{clan.name}</td>
                      <td className="p-3 text-slate-700">{clan.unitName}</td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{clan.patriarchName}</div>
                        <div className="text-[11px] text-slate-400">{clan.patriarchPhone || '—'}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {clan.totalHouseholds}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-3 h-3 shrink-0" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3">
                        {clan.culturalStatus === 'dat_chuan' ? (
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-800 block">
                              {clan.decisionNumber || 'UBND Xã phê duyệt'}
                            </span>
                            <span className="text-slate-500">Năm {clan.recognitionYear}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{clan.notes || '—'}</td>
                      {canManage && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(clan)}
                              title="Sửa thông tin & danh hiệu"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(clan.id, clan.name)}
                              title="Xóa tộc họ"
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
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

      {/* Create / Edit Clan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingClan ? 'Sửa thông tin Tộc họ & Công nhận Văn hóa' : 'Thêm mới Tộc họ / Dòng họ'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Tộc *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Tộc họ *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Tộc Nguyễn Văn"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thuộc Thôn / Tổ *
                </label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trưởng tộc / Tộc biểu
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên trưởng tộc"
                    value={formData.patriarchName}
                    onChange={(e) => setFormData({ ...formData, patriarchName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.patriarchPhone}
                    onChange={(e) => setFormData({ ...formData, patriarchPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số hộ trong tộc
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalHouseholds}
                  onChange={(e) => setFormData({ ...formData, totalHouseholds: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Cultural Recognition Section (Managed by Commune) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>Xét duyệt & Công nhận Dòng họ văn hóa (Cấp Xã/Phường nhập)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái công nhận:
                  </label>
                  <select
                    value={formData.culturalStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        culturalStatus: e.target.value as ClanCulturalStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                  >
                    <option value="dat_chuan">✓ Đã công nhận Dòng họ văn hóa</option>
                    <option value="dang_tham_tra">⏳ Đang thẩm tra hồ sơ</option>
                    <option value="chua_cong_nhan">○ Chưa công nhận</option>
                  </select>
                </div>

                {formData.culturalStatus === 'dat_chuan' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Năm công nhận
                      </label>
                      <input
                        type="number"
                        value={formData.recognitionYear}
                        onChange={(e) =>
                          setFormData({ ...formData, recognitionYear: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số Quyết định công nhận
                      </label>
                      <input
                        type="text"
                        placeholder="VD: QĐ số 118/QĐ-UBND"
                        value={formData.decisionNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, decisionNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về truyền thống dòng tộc, ban khuyến học, quỹ tương tế..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
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
                  {editingClan ? 'Cập nhật' : 'Thêm mới'}
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
        type="clan"
        onImportSuccess={(data) => {
          importClans(data);
          alert(`Đã nhập thành công ${data.length} tộc họ từ file Excel!`);
        }}
      />
    </div>
  );
};
