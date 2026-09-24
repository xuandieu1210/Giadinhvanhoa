import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ApprovalView } from './components/views/ApprovalView';
import { CategoriesView } from './components/views/CategoriesView';
import { ClansView } from './components/views/ClansView';
import { HelpGuideView } from './components/views/HelpGuideView';
import { HouseholdsView } from './components/views/HouseholdsView';
import { LoginView } from './components/views/LoginView';
import { PeriodsView } from './components/views/PeriodsView';
import { ReportsView } from './components/views/ReportsView';
import { ScoringView } from './components/views/ScoringView';
import { UnitsView } from './components/views/UnitsView';
import { UsersView } from './components/views/UsersView';
import { AppProvider, useApp } from './context/AppContext';

const MainLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('scoring');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      {/* Left Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsHelpOpen(false);
          setActiveTab(tab);
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area to the Right of the Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <Header
          onOpenHelp={() => setIsHelpOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activeTab={activeTab}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 w-full max-w-7xl mx-auto">
          {isHelpOpen ? (
            <HelpGuideView onClose={() => setIsHelpOpen(false)} />
          ) : (
            <>
              {activeTab === 'scoring' && <ScoringView />}
              {activeTab === 'approval' && <ApprovalView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'periods' && <PeriodsView />}
              {activeTab === 'categories' && (
                <CategoriesView onNavigateToTab={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'units' && <UnitsView />}
              {activeTab === 'clans' && <ClansView />}
              {activeTab === 'households' && <HouseholdsView />}
              {activeTab === 'users' && <UsersView />}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Hệ thống Bình xét Danh hiệu Văn hóa Cấp Cơ sở © 2026 — UBND Xã / Phường
            </span>
            <span className="text-[11px] text-slate-400">
              Căn cứ Nghị định số 86/2023/NĐ-CP của Chính phủ
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
