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
    terms,
    currentUser,
    users,
    switchUser,
    logout,
    periods,
    selectedPeriodId,
    setSelectedPeriodId,
    selectedPeriod,
    isPeriodExpired,
  } = useApp();

  const expired = isPeriodExpired(selectedPeriod);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'can_bo_xa':
        return { label: terms.communeOfficer, bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'to_truong':
        return { label: terms.unitLeader, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      default:
        return { label: 'Khách', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);
  const communeOfficerUser = users.find((user) => user.role === 'can_bo_xa' && user.communeId === selectedCommuneId)
    || users.find((user) => user.role === 'can_bo_xa');
  const unitLeaderUsers = users.filter((user) => user.role === 'to_truong' && user.communeId === selectedCommuneId);
  const firstUnitLeader = unitLeaderUsers[0];
  const secondUnitLeader = unitLeaderUsers[1];

  const getTabTitle = (tab: TabKey) => {
    switch (tab) {
      case 'scoring':
        return { group: 'Nghiệp vụ', title: `Chấm điểm theo đợt (${terms.unitLabel} tự chấm)` };
      case 'approval':
        return { group: 'Nghiệp vụ', title: `Thẩm định & Duyệt dữ liệu ${terms.unitLabelLower}` };
      case 'reports':
        return { group: 'Nghiệp vụ', title: 'Báo cáo & Thống kê' };
      case 'categories':
        return { group: 'Danh mục', title: 'Quản lý danh mục chỉ tiêu' };
      case 'periods':
        return { group: 'Danh mục', title: `Đợt bình xét của ${terms.communeLevel}` };
      case 'units':
        return { group: 'Dữ liệu', title: `Danh mục ${terms.unitLabel}` };
      case 'clans':
        return { group: 'Dữ liệu', title: `Dòng họ văn hóa (${terms.communeLevel} công nhận)` };
      case 'households':
        return { group: 'Dữ liệu', title: 'Hồ sơ Hộ gia đình' };
      case 'users':
        return { group: 'Hệ thống', title: 'Quản trị Người dùng & Phân quyền' };
      case 'communes':
        return { group: 'Hệ thống', title: 'Quản lý danh sách Xã / Phường' };
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
        </div>
        <div className="flex items-center gap-4 text-red-100">
          <span className="hidden xl:inline text-[11px] text-amber-200/90 font-medium">
            Hệ thống Quản lý & Bình xét Văn hóa Đa xã/phường
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
                    {c.name}
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

    </header>
  );
};
