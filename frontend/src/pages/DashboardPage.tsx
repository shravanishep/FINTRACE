import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Database,
  Trash2,
  Play,
  FileText,
} from 'lucide-react';
import { AppLayout } from '../components/Layout/AppLayout';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { investigationApi, demoApi } from '../services/api';
import { DashboardStats, InvestigationSummary } from '../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await investigationApi.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError('Failed to load dashboard workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this investigation workspace?')) {
      try {
        await investigationApi.delete(id);
        fetchDashboard();
      } catch (err) {
        alert('Failed to delete investigation');
      }
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status';
      case 'analyzing':
      case 'preprocessing':
      case 'validating':
        return 'medium';
      case 'error':
        return 'critical';
      default:
        return 'info';
    }
  };

  // Compute aggregated metric numbers across all investigations
  const totalTxns = stats?.recent_investigations.reduce((acc, i) => acc + i.total_transactions, 0) ?? 0;
  const totalSigs = stats?.recent_investigations.reduce((acc, i) => acc + i.total_signals, 0) ?? 0;
  const totalCases = stats?.recent_investigations.reduce((acc, i) => acc + i.total_cases, 0) ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-fin-border pb-4">
          <div>
            <h1 className="text-base font-bold text-fin-text">Financial Crime & Insider Risk Intelligence</h1>
            <p className="text-xs text-fin-subtext mt-0.5">
              Active financial investigations, anomaly detection, and entity relationship analysis
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="gold"
              size="sm"
              className="gap-1.5"
              isLoading={demoLoading}
              onClick={async () => {
                setDemoLoading(true);
                try {
                  const demoInv = await demoApi.loadDemo();
                  navigate(`/investigations/${demoInv.id}`);
                } catch (err: any) {
                  alert(err.response?.data?.detail || 'Failed to load demo scenario');
                  setDemoLoading(false);
                }
              }}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Load Demo Investigation
            </Button>

            <Link to="/investigations/new">
              <Button variant="primary" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Investigation
              </Button>
            </Link>
          </div>
        </div>

        {/* Compact Summary Metrics Bar */}
        <div className="fin-panel p-3.5 bg-white flex flex-wrap items-center justify-between gap-4 divide-y sm:divide-y-0 sm:divide-x divide-fin-border text-xs">
          <div className="flex-1 min-w-[120px] text-center sm:text-left sm:pr-4">
            <span className="text-fin-subtext block text-2xs uppercase tracking-wider font-semibold">Investigations</span>
            <span className="font-semibold text-sm text-fin-text font-mono mt-0.5 block">{stats?.recent_investigations.length ?? 0}</span>
          </div>

          <div className="flex-1 min-w-[140px] pt-2 sm:pt-0 sm:px-4 text-center sm:text-left">
            <span className="text-fin-subtext block text-2xs uppercase tracking-wider font-semibold">Transactions Analyzed</span>
            <span className="font-semibold text-sm text-fin-text font-mono mt-0.5 block">{totalTxns.toLocaleString()}</span>
          </div>

          <div className="flex-1 min-w-[120px] pt-2 sm:pt-0 sm:px-4 text-center sm:text-left">
            <span className="text-fin-subtext block text-2xs uppercase tracking-wider font-semibold">Signals Generated</span>
            <span className="font-semibold text-sm text-amber-600 font-mono mt-0.5 block">{totalSigs.toLocaleString()}</span>
          </div>

          <div className="flex-1 min-w-[120px] pt-2 sm:pt-0 sm:pl-4 text-center sm:text-left">
            <span className="text-fin-subtext block text-2xs uppercase tracking-wider font-semibold">Active Cases</span>
            <span className="font-semibold text-sm text-blue-600 font-mono mt-0.5 block">{totalCases.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Workspaces List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-fin-subtext uppercase tracking-wider">
              Investigations ({stats?.recent_investigations.length ?? 0})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-fin-muted text-xs fin-panel">
              Loading investigation workspaces...
            </div>
          ) : stats?.recent_investigations.length === 0 ? (
            <div className="fin-panel p-8 text-center space-y-3 bg-white">
              <Database className="h-8 w-8 text-fin-muted mx-auto opacity-40" />
              <h3 className="text-xs font-semibold text-fin-text">No Investigations Created</h3>
              <p className="text-xs text-fin-subtext max-w-sm mx-auto">
                Create an investigation and upload a financial transaction dataset to begin detection analysis.
              </p>
              <div className="pt-2">
                <Link to="/investigations/new">
                  <Button variant="primary" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    New Investigation
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="fin-panel bg-white divide-y divide-fin-borderSubtle">
              {stats?.recent_investigations.map((inv: InvestigationSummary) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/investigations/${inv.id}`)}
                  className="p-4 fin-row flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-xs text-fin-text group-hover:text-fin-accent transition-colors">
                        {inv.name}
                      </span>
                      <Badge variant={statusBadgeVariant(inv.status)}>
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-fin-subtext">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <FileText className="h-3 w-3 text-fin-muted" />
                        {inv.dataset_filename || 'No Dataset'}
                      </span>
                      <span>•</span>
                      <span>Created {new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-fin-subtext shrink-0">
                    <div className="flex items-center gap-4 text-center">
                      <div>
                        <span className="text-fin-muted text-[10px] block uppercase">Txns</span>
                        <span className="font-mono text-fin-text font-semibold">{inv.total_transactions.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-fin-muted text-[10px] block uppercase">Signals</span>
                        <span className="font-mono text-amber-600 font-semibold">{inv.total_signals}</span>
                      </div>
                      <div>
                        <span className="text-fin-muted text-[10px] block uppercase">Cases</span>
                        <span className="font-mono text-blue-600 font-semibold">{inv.total_cases}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-fin-border">
                      <button
                        onClick={(e) => handleDelete(inv.id, e)}
                        className="p-1 text-fin-muted hover:text-fin-danger transition-colors"
                        title="Delete Workspace"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
};
