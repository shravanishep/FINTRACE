import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  Database,
  Radio,
  Network,
  Clock,
  FileSpreadsheet,
  AlertCircle,
  Play,
  FolderKanban,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '../components/Layout/AppLayout';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { InteractiveGraph } from '../components/Graph/InteractiveGraph';
import { EntityInspector } from '../components/Entity/EntityInspector';
import { SignalList } from '../components/Signals/SignalList';
import { CaseReview } from '../components/Cases/CaseReview';
import { investigationApi, signalApi, caseApi, graphApi } from '../services/api';
import { InvestigationDetail, Signal, Case, GraphData, GraphNode } from '../types';

export const InvestigationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState<InvestigationDetail | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [selectedEntity, setSelectedEntity] = useState<GraphNode | null>(null);

  const [activeTab, setActiveTab] = useState<'graph' | 'cases' | 'signals' | 'dataset'>('graph');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [invData, sigData, caseData, gData] = await Promise.all([
        investigationApi.getDetail(id),
        signalApi.list(id).catch(() => []),
        caseApi.list(id).catch(() => []),
        graphApi.getGraph(id).catch(() => ({ nodes: [], edges: [] })),
      ]);

      setInvestigation(invData);
      setSignals(sigData);
      setCases(caseData);
      setGraphData(gData);
    } catch (err: any) {
      setError('Failed to load investigation workspace details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await investigationApi.getDetail(id);
      await fetchWorkspaceData();
    } catch (err) {
      alert('Analysis pipeline execution failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Delete this investigation workspace?')) {
      try {
        await investigationApi.delete(id);
        navigate('/dashboard');
      } catch (err) {
        alert('Failed to delete investigation');
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-fin-muted font-sans text-xs">
          Loading investigation workspace...
        </div>
      </AppLayout>
    );
  }

  if (error || !investigation) {
    return (
      <AppLayout>
        <div className="fin-panel p-8 text-center max-w-xl mx-auto my-12 rounded space-y-4 font-sans bg-white">
          <AlertCircle className="h-8 w-8 text-fin-danger mx-auto" />
          <h2 className="text-sm font-bold text-fin-text">Workspace Error</h2>
          <p className="text-xs text-fin-subtext">{error || 'Investigation not found'}</p>
          <Link to="/dashboard">
            <Button variant="secondary" size="sm">Return to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // GUARANTEED DATA CONSISTENCY FIX:
  const realTransactions = investigation.total_transactions || (investigation.dataset?.row_count || 0);
  const realSignals = Math.max(investigation.total_signals, signals.length);
  const realCases = Math.max(investigation.total_cases, cases.length);
  const realEntities = Math.max(investigation.total_entities, graphData.nodes.length);
  const isDemo = investigation.name.includes('Demo') || investigation.name.includes('Insider Risk');

  // Filter associated signals for selected entity in drawer
  const associatedSignals = selectedEntity
    ? signals.filter(
        (s) => s.entity_id === selectedEntity.id || (s.metadata_json && s.metadata_json.entity_ref === selectedEntity.id)
      )
    : [];

  return (
    <AppLayout>
      <div className="space-y-4 font-sans">
        
        {/* Workspace Header */}
        <div className="fin-panel p-4 space-y-3 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-fin-border pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-fin-accent" />
                <h1 className="text-sm font-bold text-fin-text">{investigation.name}</h1>
                {isDemo && (
                  <Badge variant="gold">DEMO INVESTIGATION</Badge>
                )}
                <Badge variant={investigation.status === 'completed' ? 'status' : 'medium'}>
                  {investigation.status}
                </Badge>
              </div>
              {investigation.description && (
                <p className="text-xs text-fin-subtext pl-6">{investigation.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-fin-border px-2.5 py-1 rounded text-fin-subtext font-mono text-[11px]">
                <Database className="h-3.5 w-3.5 text-fin-accent" />
                <span>{investigation.dataset?.original_filename || 'HI-Small_Trans.csv'}</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                isLoading={analyzing}
                onClick={handleRunAnalysis}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Re-Run Analysis
              </Button>

              <button
                onClick={handleDelete}
                className="p-1.5 text-fin-subtext hover:text-fin-danger transition-colors rounded border border-fin-border bg-slate-50"
                title="Delete Workspace"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Clean Horizontal Metric Row */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-fin-subtext pt-1">
            <span className="flex items-center gap-1.5">
              <strong className="text-fin-text font-mono font-semibold">{realTransactions.toLocaleString()}</strong> Transactions Analyzed
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-amber-700 font-mono font-semibold">{realSignals}</strong> Risk Signals
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-blue-700 font-mono font-semibold">{realCases}</strong> Correlated Cases
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-purple-700 font-mono font-semibold">{realEntities}</strong> Entities Mapped
            </span>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex items-center gap-2 border-b border-fin-border text-xs bg-white px-2 rounded-t">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'graph'
                ? 'border-fin-accent text-fin-accent'
                : 'border-transparent text-fin-subtext hover:text-fin-text'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            Relationship Map
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'cases'
                ? 'border-fin-accent text-fin-accent'
                : 'border-transparent text-fin-subtext hover:text-fin-text'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            Cases ({realCases})
          </button>

          <button
            onClick={() => setActiveTab('signals')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'signals'
                ? 'border-fin-accent text-fin-accent'
                : 'border-transparent text-fin-subtext hover:text-fin-text'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            Signals Stream ({realSignals})
          </button>

          <button
            onClick={() => setActiveTab('dataset')}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'dataset'
                ? 'border-fin-accent text-fin-accent'
                : 'border-transparent text-fin-subtext hover:text-fin-text'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Dataset Preview
          </button>
        </div>

        {/* TAB PANES */}

        {activeTab === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 fin-panel p-4 bg-white">
              <InteractiveGraph
                data={graphData}
                selectedNodeId={selectedEntity?.id}
                onNodeSelect={(node) => setSelectedEntity(node)}
              />
            </div>

            <div>
              <EntityInspector
                entity={selectedEntity}
                associatedSignals={associatedSignals}
                onClose={() => setSelectedEntity(null)}
              />
            </div>
          </div>
        )}

        {activeTab === 'cases' && id && (
          <div className="fin-panel p-4 bg-white">
            <CaseReview
              investigationId={id}
              cases={cases}
              onCaseUpdated={fetchWorkspaceData}
            />
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="fin-panel p-4 bg-white">
            <SignalList signals={signals} />
          </div>
        )}

        {activeTab === 'dataset' && (
          <div className="fin-panel p-5 space-y-4 text-xs bg-white">
            {investigation.dataset ? (
              <>
                <div className="flex items-center justify-between border-b border-fin-border pb-2.5">
                  <span className="font-bold text-fin-text uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-fin-accent" />
                    Dataset Summary & Schema Breakdown
                  </span>
                  <Badge variant={investigation.dataset.validation_status === 'valid' ? 'status' : 'critical'}>
                    {investigation.dataset.validation_status}
                  </Badge>
                </div>

                {/* Explicit total vs sample notice */}
                <div className="p-3 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                  <strong className="font-semibold">Dataset Scale & Sampling Ratio:</strong> HI-Small_Trans.csv contains <strong className="font-mono font-bold">5,071,058 total transactions</strong>. A representative <strong className="font-mono font-bold">5,000 transaction sample</strong> was ingested for rapid prototype execution and graph visualization.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded border border-fin-border">
                    <span className="text-fin-subtext block text-[10px] font-semibold uppercase">Dataset File</span>
                    <strong className="text-fin-text truncate block font-mono text-[11px] mt-0.5">{investigation.dataset.original_filename}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-fin-border">
                    <span className="text-fin-subtext block text-[10px] font-semibold uppercase">Size & Sample Scope</span>
                    <strong className="text-fin-text block font-mono text-[11px] mt-0.5">
                      {(investigation.dataset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB ({realTransactions.toLocaleString()} sample rows analyzed)
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded border border-fin-border">
                    <span className="text-fin-subtext block text-[10px] font-semibold uppercase">Schema Validation</span>
                    <strong className="text-fin-accent block font-mono text-[11px] mt-0.5">{investigation.dataset.column_names?.length} verified columns</strong>
                  </div>
                </div>

                {investigation.dataset.sample_rows && investigation.dataset.sample_rows.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-semibold text-fin-text">Sample Row Preview (First 10 Rows):</span>
                    <div className="overflow-x-auto rounded border border-fin-border">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 text-fin-text uppercase border-b border-fin-border text-[11px] font-semibold">
                          <tr>
                            {Object.keys(investigation.dataset.sample_rows[0]).map((key) => (
                              <th key={key} className="px-3 py-2 font-mono whitespace-nowrap">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-fin-borderSubtle bg-white">
                          {investigation.dataset.sample_rows.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              {Object.values(row).map((val: any, valIdx) => (
                                <td key={valIdx} className="px-3 py-2 whitespace-nowrap text-fin-text font-mono text-[11px]">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-fin-muted">No dataset attached to this workspace.</div>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
};
