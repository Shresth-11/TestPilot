import React, { useEffect, useState } from 'react';
import { APIEndpoint, CoverageMetrics, Project, TestCase, TestRun } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { Modal } from './components/Modal';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Endpoints } from './pages/Endpoints';
import { GeneratedTests } from './pages/GeneratedTests';
import { TestDetail } from './pages/TestDetail';
import { TestRuns } from './pages/TestRuns';
import { CoverageView } from './pages/CoverageView';
import { AlertCircle, X } from 'lucide-react';

const SAMPLE_OPENAPI_SPEC = JSON.stringify(
  {
    openapi: "3.0.3",
    info: {
      title: "Sample E-Commerce & User Management API",
      version: "1.0.0",
      description: "Target API for TestPilot automated test generation and execution."
    },
    servers: [
      {
        url: "http://localhost:8001",
        description: "Local Sample API Server"
      }
    ],
    paths: {
      "/auth/login": {
        post: {
          summary: "Authenticate User",
          description: "Authenticate user with username and password to retrieve Bearer token.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string", example: "admin@example.com" },
                    password: { type: "string", example: "password123" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Login successful" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/users": {
        get: {
          summary: "List Users",
          description: "Retrieve list of registered users.",
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 10 }
            }
          ],
          responses: {
            "200": { description: "List of users" }
          }
        },
        post: {
          summary: "Create User",
          description: "Create a new user account.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email"],
                  properties: {
                    name: { type: "string", example: "Jane Doe" },
                    email: { type: "string", example: "jane@example.com" },
                    role: { type: "string", example: "user" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "User created" }
          }
        }
      },
      "/users/{user_id}": {
        get: {
          summary: "Get User By ID",
          parameters: [
            {
              name: "user_id",
              in: "path",
              required: true,
              schema: { type: "integer" }
            }
          ],
          responses: {
            "200": { description: "User details" },
            "404": { description: "User not found" }
          }
        }
      }
    }
  },
  null,
  2
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [tests, setTests] = useState<TestCase[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [coverage, setCoverage] = useState<CoverageMetrics | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('http://localhost:8001');
  const [specContent, setSpecContent] = useState('');
  const [specFormat, setSpecFormat] = useState<'json' | 'yaml'>('json');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeProject) {
      fetchProjectData(activeProject.id);
    }
  }, [activeProject]);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        setActiveProject(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchProjectData = async (projectId: string) => {
    try {
      const specs = await api.getProjectSpecs(projectId);
      if (specs.length > 0) {
        const epData = await api.getSpecEndpoints(specs[0].id);
        setEndpoints(epData);
      } else {
        setEndpoints([]);
      }

      const testData = await api.getProjectTests(projectId);
      setTests(testData);

      const runData = await api.getProjectRuns(projectId);
      setRuns(runData);
      if (runData.length > 0) {
        fetchRunDetails(runData[0].id);
      }

      const covData = await api.getCoverage(projectId);
      setCoverage(covData);
    } catch (err: any) {
      console.error('Failed to fetch project data:', err);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    try {
      const runDetail = await api.getRun(runId);
      setActiveRun(runDetail);
    } catch (_) {}
  };

  const handleLoadDemoData = async () => {
    setLoadingDemo(true);
    setNotification(null);
    try {
      // 1. Create Sample Project
      const demoProject = await api.createProject({
        name: 'Sample E-Commerce API',
        description: 'Target API workspace for user management, authentication, and order workflows.',
        base_url: 'http://localhost:8001',
      });

      // 2. Upload Sample OpenAPI Spec
      const spec = await api.uploadSpec(demoProject.id, SAMPLE_OPENAPI_SPEC, 'json');

      // 3. Generate AI Test Cases for Spec
      await api.generateSpecTests(spec.id);

      // 4. Refresh State
      await fetchProjects();
      setActiveProject(demoProject);
      await fetchProjectData(demoProject.id);
      setNotification({ type: 'success', message: 'Sample Demo Workspace loaded successfully!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Demo loading error: ${err.message || 'HTTP 500'}` });
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      const created = await api.createProject({
        name: newProjectName,
        description: newProjectDesc,
        base_url: newProjectUrl,
      });
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      await fetchProjects();
      setActiveProject(created);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Project creation failed: ${err.message}` });
    }
  };

  const handleUploadSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !specContent) return;
    try {
      await api.uploadSpec(activeProject.id, specContent, specFormat);
      setIsSpecModalOpen(false);
      setSpecContent('');
      await fetchProjectData(activeProject.id);
      setActiveTab('endpoints');
    } catch (err: any) {
      setNotification({ type: 'error', message: `Spec parsing failed: ${err.message}` });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      setActiveProject(remaining[0] || null);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Delete failed: ${err.message}` });
    }
  };

  const handleGenerateEndpointTests = async (endpointId: string) => {
    try {
      await api.generateEndpointTests(endpointId);
      if (activeProject) await fetchProjectData(activeProject.id);
      setActiveTab('tests');
    } catch (err: any) {
      setNotification({ type: 'error', message: `Test generation failed: ${err.message}` });
    }
  };

  const handleRunSingleTest = async (testId: string) => {
    try {
      await api.runSingleTest(testId);
      if (activeProject) await fetchProjectData(activeProject.id);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Execution failed: ${err.message}` });
    }
  };

  const handleRunSuite = async () => {
    if (!activeProject) return;
    try {
      const run = await api.runProjectSuite(activeProject.id);
      await fetchProjectData(activeProject.id);
      setActiveTab('runs');
      fetchRunDetails(run.id);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Suite execution failed: ${err.message}` });
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await api.deleteTest(testId);
      if (activeProject) await fetchProjectData(activeProject.id);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Delete failed: ${err.message}` });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => setActiveProject(p)}
      />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-3 border-b flex items-center justify-between text-xs font-medium font-sans ${
            notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedTest(null);
            setActiveTab(tab);
          }}
          counts={{
            projects: projects.length,
            endpoints: endpoints.length,
            tests: tests.length,
            runs: runs.length,
          }}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {selectedTest ? (
            <TestDetail testCase={selectedTest} onBack={() => setSelectedTest(null)} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  projects={projects}
                  tests={tests}
                  runs={runs}
                  coverage={coverage}
                  activeProject={activeProject}
                  onNavigate={setActiveTab}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onLoadDemoData={handleLoadDemoData}
                  loadingDemo={loadingDemo}
                />
              )}

              {activeTab === 'projects' && (
                <Projects
                  projects={projects}
                  activeProject={activeProject}
                  onSelectProject={setActiveProject}
                  onDeleteProject={handleDeleteProject}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onOpenSpecModal={() => setIsSpecModalOpen(true)}
                />
              )}

              {activeTab === 'endpoints' && (
                <Endpoints endpoints={endpoints} onGenerateEndpointTests={handleGenerateEndpointTests} />
              )}

              {activeTab === 'tests' && (
                <GeneratedTests
                  tests={tests}
                  onRunSingleTest={handleRunSingleTest}
                  onRunSuite={handleRunSuite}
                  onDeleteTest={handleDeleteTest}
                  onSelectTest={setSelectedTest}
                />
              )}

              {activeTab === 'runs' && (
                <TestRuns
                  runs={runs}
                  activeRun={activeRun}
                  onSelectRun={(runId) => fetchRunDetails(runId)}
                />
              )}

              {activeTab === 'coverage' && <CoverageView coverage={coverage} />}
            </>
          )}
        </main>
      </div>

      {/* Modal 1: Create Project */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Target Project Workspace">
        <form onSubmit={handleCreateProject} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sample E-Commerce API"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Base URL</label>
            <input
              type="text"
              placeholder="http://localhost:8001"
              value={newProjectUrl}
              onChange={(e) => setNewProjectUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description</label>
            <textarea
              placeholder="Target API workspace description..."
              rows={3}
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors border border-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 font-semibold text-white transition-colors shadow-2xs">
              Create Workspace
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Upload OpenAPI Spec */}
      <Modal isOpen={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} title="Upload OpenAPI Specification">
        <form onSubmit={handleUploadSpec} className="space-y-4 font-sans text-xs">
          <div className="flex items-center space-x-4 mb-2">
            <span className="text-slate-700 font-semibold">Spec Format:</span>
            <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-800">
              <input
                type="radio"
                name="format"
                value="json"
                checked={specFormat === 'json'}
                onChange={() => setSpecFormat('json')}
              />
              <span>JSON</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-800">
              <input
                type="radio"
                name="format"
                value="yaml"
                checked={specFormat === 'yaml'}
                onChange={() => setSpecFormat('yaml')}
              />
              <span>YAML</span>
            </label>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Paste OpenAPI 3.x Specification Content *</label>
            <textarea
              required
              rows={10}
              placeholder='Paste JSON/YAML e.g. {"openapi": "3.0.0", "info": ...}'
              value={specContent}
              onChange={(e) => setSpecContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSpecModalOpen(false)}
              className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors border border-slate-300"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 font-semibold text-white transition-colors shadow-2xs">
              Parse & Save Spec
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
