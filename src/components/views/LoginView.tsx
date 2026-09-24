import React, { useState } from 'react';
import { AlertCircle, KeyRound, Lock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(username, password);
    if (!res.success) {
      setError(res.message || 'Đăng nhập thất bại!');
    }
  };

  const handleSelectQuickAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    login(u, p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-red-50/20 to-slate-200 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Emblem & Top Bar */}
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white p-6 text-center space-y-2 relative">
          <div className="w-14 h-14 bg-amber-400 text-red-900 rounded-full flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            ★
          </div>
          <div>
            <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-widest block">
              Cộng hòa Xã hội Chủ nghĩa Việt Nam
            </span>
            <h1 className="text-base font-extrabold uppercase tracking-tight text-white mt-1">
              Phần mềm Bình xét Văn hóa
            </h1>
            <p className="text-xs text-red-100 mt-0.5">
              Hệ thống quản lý & bình xét danh hiệu văn hóa cấp cơ sở
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="admin / xa / to1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-md shadow-red-700/20"
            >
              Đăng nhập vào hệ thống
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Đăng nhập nhanh bằng tài khoản Demo:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('admin', 'admin123')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-center transition"
              >
                <div className="text-[11px] font-bold text-purple-900">Admin</div>
                <div className="text-[10px] text-purple-700 font-mono mt-0.5">admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('xa', 'xa123')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center transition"
              >
                <div className="text-[11px] font-bold text-blue-900">Cán bộ Xã</div>
                <div className="text-[10px] text-blue-700 font-mono mt-0.5">xa123</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickAccount('to1', 'to123')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-center transition"
              >
                <div className="text-[11px] font-bold text-emerald-900">Tổ trưởng 1</div>
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">to123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
