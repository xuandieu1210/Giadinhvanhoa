import React, { useState } from 'react';
import { Edit2, Key, Plus, Shield, ShieldAlert, Trash2, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const { users, units, addUser, updateUser, deleteUser, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: 'to_truong' as UserRole,
    unitId: units[0]?.id || '',
    phone: '',
    email: '',
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-xl border border-red-200 text-center max-w-lg mx-auto space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Quyền truy cập bị giới hạn</h3>
        <p className="text-xs text-slate-500">
          Chỉ Quản trị viên (Admin) mới có quyền truy cập vào màn hình quản lý người dùng và phân quyền hệ thống.
        </p>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      fullName: '',
      role: 'to_truong',
      unitId: units[0]?.id || '',
      phone: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
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
    if (formData.role === 'to_truong') {
      const u = units.find((x) => x.id === formData.unitId);
      unitName = u ? u.name : 'Chưa phân';
    } else if (formData.role === 'can_bo_xa') {
      unitName = 'UBND Xã';
    }

    const payload = {
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      role: formData.role,
      unitId: formData.role === 'to_truong' ? formData.unitId : (formData.role === 'can_bo_xa' ? 'xa' : undefined),
      unitName,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      // Check duplicate username
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quản lý Người Dùng & Phân Quyền</h2>
            <p className="text-xs text-slate-500">
              Chỉ Quản trị viên cấp cao có quyền tạo, sửa thông tin, đổi vai trò và đơn vị phân công
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng mới
        </button>
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
              {users.map((u, idx) => {
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
                    <td className="p-3 font-medium text-slate-800">{u.unitName || 'Toàn hệ thống'}</td>
                    <td className="p-3 text-slate-600">{u.phone || '—'}</td>
                    <td className="p-3 text-slate-600">{u.email || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Sửa thông tin & vai trò"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={isCurrent}
                          title={isCurrent ? 'Không thể xóa tài khoản của chính bạn' : 'Xóa tài khoản'}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                {editingUser ? 'Sửa thông tin & Đổi vai trò người dùng' : 'Thêm người dùng mới'}
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
                    Tên đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden disabled:bg-slate-100"
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
                  />
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò hệ thống *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                >
                  <option value="to_truong">Tổ trưởng / Trưởng thôn (Cấp cơ sở)</option>
                  <option value="can_bo_xa">Cán bộ Xã/Phường (Cấp thẩm định & duyệt)</option>
                  <option value="admin">Quản trị viên (Toàn quyền quản trị)</option>
                </select>
              </div>

              {/* Đơn vị phân công nếu là Tổ trưởng */}
              {formData.role === 'to_truong' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị Thôn / Tổ được phân công phụ trách *
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center gap-2">
                <Key className="w-4 h-4 shrink-0 text-purple-600" />
                <span>
                  Mật khẩu mặc định: <strong>[tên_đăng_nhập]123</strong> (VD: admin123, xa123, to123)
                </span>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-xs"
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
