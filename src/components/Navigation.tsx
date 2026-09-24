import React from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  FileCheck2,
  FolderTree,
  HelpCircle,
  Home,
  LogOut,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  Users2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type TabKey =
  | 'units'
  | 'clans'
  | 'households'
  | 'categories'
  | 'periods'
  | 'scoring'
  | 'approval'
  | 'reports'
  | 'users'
  | 'guide';

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
  description?: string;
  hidden?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenHelp?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  onOpenHelp,
}) => {
  const {
    currentUser,
    selectedCommune,
    units,
    clans,
    progressList,
    selectedPeriodId,
    selectedPeriod,
    isPeriodExpired,
    logout,
  } = useApp();

  // Count pending units for approval
  const pendingApprovalCount = units.filter((u) => {
    const p = progressList.find((prog) => prog.unitId === u.id && prog.periodId === selectedPeriodId);
    return p?.status === 'da_gui';
  }).length;

  const isToTruong = currentUser?.role === 'to_truong';
  const isAdmin = currentUser?.role === 'admin';
  const expired = isPeriodExpired(selectedPeriod);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'can_bo_xa':
        return { label: 'Cán bộ Xã', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'to_truong':
        return { label: 'Tổ trưởng', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Khách', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  // Grouped menu structure
  const navSections: NavSection[] = [
    {
      title: 'NGHIỆP VỤ BÌNH XÉT',
      items: [
        {
          key: 'scoring' as TabKey,
          label: 'Chấm điểm theo đợt',
          icon: CheckSquare,
          badge: null,
          badgeColor: '',
          description: 'Thôn/Tổ tự chấm hộ & tổ mình',
        },
        {
          key: 'approval' as TabKey,
          label: 'Duyệt dữ liệu của tổ',
          icon: FileCheck2,
          badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} chờ` : null,
          badgeColor: 'bg-amber-500 text-white',
          description: 'Hội đồng xã thẩm tra & chốt',
          hidden: isToTruong,
        },
        {
          key: 'reports' as TabKey,
          label: 'Báo cáo & Thống kê',
          icon: BarChart3,
          badge: null,
          badgeColor: '',
          description: 'Biểu mẫu, quyết định, khen thưởng',
        },
      ],
    },
    {
      title: 'DANH MỤC & DỮ LIỆU',
      items: [
        {
          key: 'categories' as TabKey,
          label: 'Quản lý danh mục',
          icon: FolderTree,
          badge: 'NĐ 86',
          badgeColor: 'bg-red-100 text-red-700 border border-red-200',
          description: 'Tiêu chuẩn, Điểm cộng/trừ, Danh hiệu',
        },
        {
          key: 'periods' as TabKey,
          label: 'Đợt bình xét',
          icon: CalendarDays,
          badge: null,
          badgeColor: '',
          description: 'Xã/phường tự tạo & quản lý',
        },
        {
          key: 'units' as TabKey,
          label: 'Thôn / Tổ dân phố',
          icon: Home,
          badge: `${units.length}`,
          badgeColor: 'bg-slate-100 text-slate-600',
          description: 'Đơn vị tự chấm điểm cơ sở',
        },
        {
          key: 'clans' as TabKey,
          label: 'Tộc họ / Dòng họ',
          icon: Users2,
          badge: `${clans.length}`,
          badgeColor: 'bg-amber-100 text-amber-800',
          description: 'Xã công nhận (không chấm điểm)',
        },
        {
          key: 'households' as TabKey,
          label: 'Hộ gia đình',
          icon: Users,
          badge: null,
          badgeColor: '',
          description: 'Hồ sơ nhân khẩu hộ dân',
        },
      ],
    },
    {
      title: 'HỆ THỐNG & HỖ TRỢ',
      items: [
        {
          key: 'users' as TabKey,
          label: 'Quản lý người dùng',
          icon: ShieldAlert,
          badge: 'Admin',
          badgeColor: 'bg-purple-100 text-purple-700',
          description: 'Phân quyền tài khoản cơ sở',
          hidden: !isAdmin,
        },
      ],
    },
  ];

  const handleSelect = (key: TabKey) => {
    onSelectTab(key);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-900/40 font-black text-lg shrink-0 border border-amber-400/30">
            VH
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-black text-white leading-tight uppercase tracking-tight flex items-center gap-1.5">
              <span>Bình xét Văn hóa</span>
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-900/80 text-amber-300 rounded border border-red-700/50">
                CẤP CƠ SỞ
              </span>
              <span className="text-[10px] text-slate-400">NĐ 86/CP</span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Commune Badge */}
      {selectedCommune && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-gradient-to-r from-amber-950/60 to-slate-800/90 border border-amber-500/30 text-xs">
          <div className="text-[10px] uppercase font-bold text-amber-300/80 mb-0.5 flex items-center gap-1">
            <span>🏛️ ĐƠN VỊ ĐANG LÀM VIỆC</span>
          </div>
          <div className="font-extrabold text-white text-xs truncate">
            {selectedCommune.name}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {selectedCommune.district}, {selectedCommune.province}
          </div>
        </div>
      )}

      {/* Selected Period Notification Pill */}
      {selectedPeriod && (
        <div className="mx-3 mt-2 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
            <span>Đợt xét hiện hành</span>
            {expired ? (
              <span className="text-rose-400 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Đã đóng
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-0.5">
                ● Đang mở
              </span>
            )}
          </div>
          <div className="font-bold text-white text-xs truncate">
            {selectedPeriod.year} - {selectedPeriod.name}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-sidebar-scroll">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => !item.hidden);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>{section.title}</span>
              </div>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelect(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md shadow-red-950/50 font-bold border-l-4 border-amber-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition ${
                          isActive
                            ? 'text-amber-300'
                            : 'text-slate-400 group-hover:text-amber-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                            item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive
                            ? 'text-amber-300 translate-x-0.5'
                            : 'text-slate-600 group-hover:text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Quick Help Guide Button */}
        {onOpenHelp && (
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onOpenHelp();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-300/90 hover:text-amber-200 hover:bg-slate-800/80 transition cursor-pointer border border-amber-500/20"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Hướng dẫn sử dụng</span>
            </button>
          </div>
        )}
      </div>

      {/* User Info & Footer */}
      {currentUser && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 border border-slate-600">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.fullName}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] px-1 rounded font-semibold ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                  {currentUser.unitName && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[85px]">
                      • {currentUser.unitName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 shrink-0 border-r border-slate-800 z-30 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over with overlay) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
