import React, { useState } from 'react';
import { Edit2, Key, Plus, Shield, ShieldAlert, Trash2, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const { users, units, communes, selectedCommuneId, addUser, updateUser, deleteUser, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: (currentUser?.role === 'to_truong' ? 'to_truong' : 'to_truong') as UserRole,
    communeId: currentUser?.communeId || selectedCommuneId || communes[0]?.id || '',
    unitId: currentUser?.role === 'to_truong' ? (currentUser.unitId || units[0]?.id || '') : (units[0]?.id || ''),
    phone: '',
    email: '',
  });

  // Determine permissions
  const isAdmin = currentUser?.role === 'admin';
  const isXa = currentUser?.role === 'can_bo_xa';
  const isToTruong = currentUser?.role === 'to_truong';

  // Filtered users based on role
  let visibleUsers = users;
  if (isToTruong) {
    visibleUsers = users.filter((u) => u.unitId === currentUser.unitId);
  } else if (selectedUnitFilter !== 'all') {
    visibleUsers = users.filter((u) => u.unitId === selectedUnitFilter);
  }

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      fullName: '',
      role: isToTruong ? 'to_truong' : 'to_truong',
      communeId: currentUser?.communeId || selectedCommuneId || communes[0]?.id || '',
      unitId: isToTruong ? (currentUser?.unitId || '') : (units[0]?.id || ''),
      phone: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    // If to_truong, can only edit users in their unit
    if (isToTruong && u.unitId !== currentUser?.unitId) {
      alert('Bạn chỉ có quyền quản lý người dùng trong đơn vị của mình!');
      return;
    }
    setEditingUser(u);
    setFormData({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      communeId: u.communeId || selectedCommuneId || communes[0]?.id || '',
      unitId: u.unitId || (units[0]?.id || ''),
      phone: u.phone || '',
      email: u.email || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.fullName.trim()) {
      alert('Vui lòng điền đầy đủ tên đăng nhập và họ tên!');
      return;
    }

    let unitName = 'Toàn hệ thống';
    const targetUnitId = isToTruong ? currentUser?.unitId : formData.unitId;
    const targetRole = isToTruong ? 'to_truong' : formData.role;
    const targetCommuneId = isToTruong
      ? (currentUser?.communeId || selectedCommuneId)
      : (formData.communeId || selectedCommuneId);
    const targetCommune = communes.find((commune) => commune.id === targetCommuneId);

    if (targetRole === 'to_truong') {
      const u = units.find((x) => x.id === targetUnitId);
      unitName = u ? u.name : 'Chưa phân';
    } else if (targetRole === 'can_bo_xa') {
      unitName = `UBND ${targetCommune?.name || 'Xã/Phường'}`;
    }

    const payload = {
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      role: targetRole,
      communeId: targetCommuneId,
      communeName: targetCommune?.name || '',
      unitId: targetRole === 'to_truong' ? targetUnitId : (targetRole === 'can_bo_xa' ? 'xa' : undefined),
      unitName,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      if (users.some((u) => u.username.toLowerCase() === formData.username.trim().toLowerCase())) {
        alert('Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.');
        return;
      }
      addUser(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, username: string) => {
    if (currentUser?.id === id) {
      alert('Không thể xóa tài khoản của chính bạn đang đăng nhập!');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa tài khoản "${username}"?`)) {
      deleteUser(id);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { text: 'Quản trị viên (Admin)', style: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'can_bo_xa':
        return { text: 'Cán bộ Xã/Phường', style: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'to_truong':
        return { text: 'Tổ trưởng / Trưởng thôn', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const currentUnitObj = units.find((u) => u.id === currentUser?.unitId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isToTruong ? `Quản lý Người Dùng - ${currentUnitObj?.name || 'Đơn vị'}` : 'Quản lý Người Dùng & Phân Quyền'}
            </h2>
            <p className="text-xs text-slate-500">
              {isToTruong
                ? 'Thêm và phân quyền tài khoản phụ trách, ban vận động trong thôn/tổ'
                : 'Quản lý toàn bộ tài khoản hệ thống, cán bộ xã và tổ trưởng các thôn/tổ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && units.length > 0 && (
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">Tất cả đơn vị (Thôn/Tổ)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            {isToTruong ? 'Thêm tài khoản đơn vị' : 'Thêm người dùng mới'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Tên đăng nhập</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Vai trò hệ thống</th>
                <th className="p-3">Đơn vị phụ trách</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u, idx) => {
                  const roleBadge = getRoleLabel(u.role);
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {u.username}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            (Bạn)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{u.fullName}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge.style}`}>
                          {roleBadge.text}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{u.role === 'can_bo_xa' ? (u.communeName || u.unitName || 'Chưa gán xã/phường') : (u.unitName || 'Toàn hệ thống')}</td>
                      <td className="p-3 text-slate-600">{u.phone || '—'}</td>
                      <td className="p-3 text-slate-600">{u.email || '—'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Sửa thông tin"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={isCurrent}
                            title={isCurrent ? 'Không thể xóa tài khoản của chính bạn' : 'Xóa tài khoản'}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-purple-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingUser ? 'Sửa thông tin người dùng' : isToTruong ? 'Thêm tài khoản thuộc đơn vị' : 'Thêm người dùng mới'}
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
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden disabled:bg-slate-100"
                    placeholder="VD: totruong_thuan"
                  />
                  {editingUser && (
                    <span className="text-[10px] text-slate-400">Không thể đổi tên đăng nhập</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Vai trò */}
              {!isToTruong ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white cursor-pointer"
                  >
                    <option value="to_truong">Tổ trưởng / Trưởng thôn (Cấp cơ sở)</option>
                    <option value="can_bo_xa">Cán bộ Xã/Phường (Cấp thẩm định & duyệt)</option>
                    <option value="admin">Quản trị viên (Toàn quyền quản trị)</option>
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  Tài khoản thêm mới sẽ thuộc đơn vị: <strong>{currentUnitObj?.name}</strong> (Vai trò: Tổ trưởng / Trưởng thôn)
                </div>
              )}

              {!isToTruong && formData.role === 'can_bo_xa' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Xã / Phường / Đặc khu phụ trách *
                  </label>
                  <select
                    value={formData.communeId}
                    onChange={(e) => setFormData({ ...formData, communeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white cursor-pointer"
                  >
                    {communes.map((commune) => (
                      <option key={commune.id} value={commune.id}>
                        {commune.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Đơn vị phân công nếu không phải to_truong */}
              {!isToTruong && formData.role === 'to_truong' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị Thôn / Tổ được phân công phụ trách *
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white cursor-pointer"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="VD: 0912345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    placeholder="VD: email@domain.com"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center gap-2">
                <Key className="w-4 h-4 shrink-0 text-purple-600" />
                <span>
                  Mật khẩu mặc định: <strong>[tên_đăng_nhập]123</strong>
                </span>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
