import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar, TabType } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { ScanPipelineView } from './components/ScanPipelineView.js';
import { AttackSurfaceExplorer } from './components/AttackSurfaceExplorer.js';
import { EndpointsView } from './components/EndpointsView.js';
import { FindingsView } from './components/FindingsView.js';
import { RulesView } from './components/RulesView.js';
import { ReportsView } from './components/ReportsView.js';
import { ScanLauncherModal } from './components/ScanLauncherModal.js';
import { EvidenceModal } from './components/EvidenceModal.js';
import { api } from './api.js';
import { Project, Target, Scan, Finding, DiscoveredEndpoint, AttackSurfaceGraph, RuleMeta } from './types.js';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [endpoints, setEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [graph, setGraph] = useState<AttackSurfaceGraph | null>(null);
  const [rules, setRules] = useState<RuleMeta[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);

  // Load Initial Projects & Rules
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const loadedProjects = await api.getProjects();
        setProjects(loadedProjects);
        if (loadedProjects.length > 0) {
          setSelectedProject(loadedProjects[0]);
        }

        const loadedRules = await api.getRules();
        setRules(loadedRules);

        const loadedScans = await api.getScans();
        setScans(loadedScans);
        if (loadedScans.length > 0) {
          setActiveScan(loadedScans[loadedScans.length - 1]);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadInitial();
  }, []);

  // Load Project Targets & Scan Data
  useEffect(() => {
    if (!selectedProject) return;

    const loadProjectData = async () => {
      try {
        const loadedTargets = await api.getTargets(selectedProject.id);
        setTargets(loadedTargets);
      } catch (err) {
        console.error('Failed to load project targets:', err);
      }
    };
    loadProjectData();
  }, [selectedProject]);

  // Load Active Scan Details, Findings, Endpoints & Graph
  useEffect(() => {
    if (!activeScan) return;

    const loadScanArtifacts = async () => {
      try {
        const [loadedFindings, loadedEndpoints, loadedGraph] = await Promise.all([
          api.getFindings(activeScan.id),
          api.getEndpoints(activeScan.id),
          api.getAttackSurface(activeScan.id)
        ]);
        setFindings(loadedFindings);
        setEndpoints(loadedEndpoints);
        setGraph(loadedGraph);
      } catch (err) {
        console.error('Failed to load scan artifacts:', err);
      }
    };

    loadScanArtifacts();
  }, [activeScan?.id, activeScan?.status]);

  // Connect WebSocket for Live Scan Telemetry
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'SCAN_UPDATE') {
          setScans((prev) => {
            const index = prev.findIndex(s => s.id === msg.scanId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], status: msg.status, stats: msg.stats };
              return updated;
            }
            return prev;
          });

          setActiveScan((prev) => {
            if (prev && prev.id === msg.scanId) {
              return { ...prev, status: msg.status, stats: msg.stats };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleLaunchScan = async (params: {
    projectId: string;
    targetId?: string;
    customUrl?: string;
    profileName: string;
    activeTestingEnabled: boolean;
    maxRequestsPerSecond: number;
  }) => {
    try {
      let targetId = params.targetId;
      if (params.customUrl) {
        const createdTarget = await api.createTarget(params.projectId, params.customUrl);
        targetId = createdTarget.id;
        setTargets(prev => [...prev, createdTarget]);
      }
      if (!targetId) return;

      const newScan = await api.startScan({
        projectId: params.projectId,
        targetId,
        profileName: params.profileName,
        activeTestingEnabled: params.activeTestingEnabled,
        maxRequestsPerSecond: params.maxRequestsPerSecond
      });
      setScans(prev => [newScan, ...prev]);
      setActiveScan(newScan);
      setCurrentTab('pipeline');
    } catch (err) {
      console.error('Failed to launch scan:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <Header
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        onOpenLauncher={() => setIsLauncherOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          findingsCount={findings.length}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              scans={scans}
              activeScan={activeScan}
              findings={findings}
              onSelectScan={(s) => {
                setActiveScan(s);
                setCurrentTab('pipeline');
              }}
              onNavigateToFindings={() => setCurrentTab('findings')}
              onNavigateToPipeline={() => setCurrentTab('pipeline')}
            />
          )}

          {currentTab === 'pipeline' && (
            <ScanPipelineView activeScan={activeScan} />
          )}

          {currentTab === 'attack-surface' && (
            <AttackSurfaceExplorer graph={graph} />
          )}

          {currentTab === 'endpoints' && (
            <EndpointsView endpoints={endpoints} />
          )}

          {currentTab === 'findings' && (
            <FindingsView
              findings={findings}
              onSelectFinding={setSelectedFinding}
            />
          )}

          {currentTab === 'rules' && (
            <RulesView rules={rules} />
          )}

          {currentTab === 'reports' && (
            <ReportsView activeScan={activeScan} />
          )}
        </main>
      </div>

      <ScanLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        targets={targets}
        selectedProject={selectedProject}
        onLaunch={handleLaunchScan}
      />

      <EvidenceModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </div>
  );
};
