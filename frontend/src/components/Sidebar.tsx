import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileCode2,
  FlaskConical,
  PlayCircle,
  BarChart3,
} from 'lucide-react';

export type TabType = 'dashboard' | 'projects' | 'endpoints' | 'tests' | 'runs' | 'coverage';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  counts: {
    projects: number;
    endpoints: number;
    tests: number;
    runs: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, counts }) => {
  const items = [
    { id: 'dashboard' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'projects' as TabType, label: 'Projects', icon: FolderKanban, badge: counts.projects },
    { id: 'endpoints' as TabType, label: 'Endpoints', icon: FileCode2, badge: counts.endpoints },
    { id: 'tests' as TabType, label: 'Test Cases', icon: FlaskConical, badge: counts.tests },
    { id: 'runs' as TabType, label: 'Test Runs', icon: PlayCircle, badge: counts.runs },
    { id: 'coverage' as TabType, label: 'Coverage', icon: BarChart3 },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between p-3 font-sans">
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-mono font-medium px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
