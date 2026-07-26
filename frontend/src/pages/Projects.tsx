import React from 'react';
import { Project } from '../types';
import { Plus, Trash2, FileCode2 } from 'lucide-react';

interface ProjectsProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenSpecModal: () => void;
}

export const Projects: React.FC<ProjectsProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onDeleteProject,
  onOpenCreateModal,
  onOpenSpecModal,
}) => {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Projects & Specifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage target API workspaces and OpenAPI specifications.</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs shadow-2xs">
          No projects available. Click "New Project" to create a workspace.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const isSelected = activeProject?.id === p.id;
            return (
              <div
                key={p.id}
                className={`bg-white border p-4.5 rounded-lg flex flex-col justify-between space-y-4 transition-all shadow-2xs ${
                  isSelected ? 'border-indigo-600 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                    {isSelected && (
                      <span className="text-[10px] font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                        Active Workspace
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description || 'No description provided.'}</p>
                  <div className="text-[11px] text-slate-500 mt-2.5 font-mono">
                    Base URL: <code className="text-slate-800 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{p.base_url || 'http://localhost:8000'}</code>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectProject(p)}
                      className="bg-white hover:bg-slate-50 text-xs text-slate-700 px-3 py-1.5 rounded-md font-medium transition-colors border border-slate-300 shadow-2xs"
                    >
                      Select Workspace
                    </button>
                    <button
                      onClick={() => {
                        onSelectProject(p);
                        onOpenSpecModal();
                      }}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 shadow-2xs"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Spec</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteProject(p.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded hover:bg-slate-100"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
