import React from 'react';
import { Compass, ChevronDown, Github } from 'lucide-react';
import { Project } from '../types';

interface NavbarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ projects, activeProject, onSelectProject }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between text-xs font-sans">
      <div className="flex items-center space-x-5">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <span className="font-semibold text-sm text-slate-900 tracking-tight">TestPilot</span>
        </div>

        {/* Workspace Selector */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-5">
          <span className="text-slate-500 font-medium text-xs">Workspace:</span>
          <div className="relative">
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const selected = projects.find((p) => p.id === e.target.value);
                if (selected) onSelectProject(selected);
              }}
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-md px-3 py-1.5 pr-8 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer transition-colors"
            >
              {projects.length === 0 ? (
                <option value="">No Active Workspace</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <a
          href="https://github.com/Shresth-11/TestPilot"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-md"
        >
          <Github className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
};
