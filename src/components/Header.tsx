import React from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  HelpCircle,
  LogOut,
  MapPin,
  Menu,
  RefreshCw,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabKey } from './Navigation';

interface HeaderProps {
  onOpenHelp: () => void;
  onToggleMobileSidebar?: () => void;
  activeTab?: TabKey;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHelp,
  onToggleMobileSidebar,
  activeTab = 'scoring',
}) => {
  const {
    communes,
    selectedCommuneId,
    setSelectedCommuneId,
    selectedCommune,
    currentUser,
    switchUser,
    logout,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    selectedPeriod,
    isPeriodExpired,
    resetAllData,
  } = useApp();

  const expired = isPeriodExpired(selectedPeriod);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'can_bo_xa':
        return { label: 'Cán bộ Xã/Phường', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'to_truong':
        return { label: 'Tổ trưởng / Trưởng thôn', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: 'Khách', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  const getTabTitle = (tab: TabKey) => {
    switch (tab) {
      case 'scoring':
        return { group: 'Nghiệp vụ', title: 'Chấm điểm theo đợt (Thôn/Tổ tự chấm)' };
      case 'approval':
        return { group: 'Nghiệp vụ', title: 'Thẩm định & Duyệt dữ liệu của tổ' };
      case 'reports':
        return { group: 'Nghiệp vụ', title: 'Báo cáo & Thống kê' };
      case 'categories':
        return { group: 'Danh mục', title: 'Quản lý danh mục chuẩn (NĐ 86)' };
      case 'periods':
        return { group: 'Danh mục', title: 'Đợt bình xét của Xã/Phường' };
      case 'units':
        return { group: 'Dữ liệu', title: 'Danh mục Thôn / Tổ dân phố' };
      case 'clans':
        return { group: 'Dữ liệu', title: 'Dòng họ văn hóa (Xã công nhận)' };
      case 'households':
        return { group: 'Dữ liệu', title: 'Hồ sơ Hộ gia đình' };
      case 'users':
        return { group: 'Hệ thống', title: 'Quản trị Người dùng & Phân quyền' };
      default:
        return { group: 'Hệ thống', title: 'Bình xét văn hóa' };
    }
  };

  const currentTabInfo = getTabTitle(activeTab);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      {/* Top Administrative Red Strip */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Vietnamese emblem icon / star */}
          <div className="w-4 h-4 rounded-full bg-amber-400 text-red-900 flex items-center justify-center font-black text-[10px] shadow-xs">
            ★
          </div>
          <span className="font-bold tracking-wide uppercase text-[11px]">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập - Tự do - Hạnh phúc
          </span>
        </div>
        <div className="flex items-center gap-4 text-red-100">
          <span className="hidden xl:inline text-[11px] text-amber-200/90 font-medium">
            Hệ thống Quản lý & Bình xét Văn hóa Đa xã/phường (NĐ 86/2023/NĐ-CP)
          </span>
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1 text-amber-200 hover:text-white underline font-semibold transition cursor-pointer text-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hướng dẫn sử dụng</span>
          </button>
        </div>
      </div>

      {/* Main Top Header Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Hamburger menu (mobile) & Current View Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="p-2 -ml-1 text-slate-700 hover:text-red-700 hover:bg-slate-100 rounded-lg lg:hidden transition cursor-pointer"
              title="Mở menu danh mục"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>{currentTabInfo.group}</span>
              <span>/</span>
              <span className="text-red-700 font-extrabold">{currentTabInfo.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 leading-none">
                {currentTabInfo.title}
              </h2>
              {selectedCommune && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  {selectedCommune.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Commune Selector + Evaluation Period Selector */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Commune Selector (Đa xã/phường) */}
          <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200 rounded-lg p-1 px-2.5">
            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="flex flex-col">
              <label className="text-[9px] uppercase font-bold text-amber-800 leading-tight">
                Xã / Phường:
              </label>
              <select
                value={selectedCommuneId}
                onChange={(e) => setSelectedCommuneId(e.target.value)}
                className="text-xs font-bold text-amber-950 bg-transparent border-none focus:outline-none cursor-pointer pr-2"
              >
                {communes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evaluation Period Selector for the chosen Commune */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2.5">
            <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <div className="flex flex-col">
              <label className="text-[9px] uppercase font-bold text-slate-400 leading-tight">
                Đợt bình xét của xã:
              </label>
              {periods.length === 0 ? (
                <span className="text-xs font-semibold text-slate-400 italic">Chưa có đợt nào</span>
              ) : (
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.year} - {p.name} {p.status === 'closed' ? '(Đã đóng)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Deadline Indicator */}
            {selectedPeriod && (
              <div className="hidden sm:block ml-2 pl-2 border-l border-slate-200">
                {expired ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    Đã hết hạn
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    Đang mở
                  </span>
                )}
              </div>
            )}
          </div>

          {/* User info */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate max-w-[130px]">{currentUser.fullName}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Đăng xuất"
                className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Demo Quick Switcher Toolbar */}
      <div className="bg-amber-50/80 border-t border-amber-200/60 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        {/* Left: Quick Commune Switch */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-amber-900 font-bold text-[11px] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-700" />
            Chọn nhanh Xã/Phường:
          </span>
          {communes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCommuneId(c.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition border cursor-pointer ${
                selectedCommuneId === c.id
                  ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                  : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/60'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Right: Quick User Accounts & Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-slate-600 font-bold text-[11px]">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Tài khoản:</span>
          </div>
          <button
            type="button"
            onClick={() => switchUser('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border cursor-pointer ${
              currentUser?.username === 'admin'
                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => switchUser('xa')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border cursor-pointer ${
              currentUser?.username === 'xa'
                ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
            }`}
          >
            Cán bộ xã
          </button>
          <button
            type="button"
            onClick={() => switchUser('to1')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border cursor-pointer ${
              currentUser?.username === 'to1'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Tổ trưởng 1
          </button>
          <button
            type="button"
            onClick={() => switchUser('to2')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border cursor-pointer ${
              currentUser?.username === 'to2'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Tổ trưởng 2
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu?')) {
                resetAllData();
              }
            }}
            title="Khôi phục dữ liệu mẫu ban đầu"
            className="ml-2 px-2 py-0.5 text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Khôi phục mẫu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
