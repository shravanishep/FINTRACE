import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  Shield,
  Clock,
  AlertTriangle,
  Cpu,
  Layers,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { caseApi } from '../../services/api';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

interface ReportModalProps {
  investigationId: string;
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  investigationId,
  caseId,
  isOpen,
  onClose,
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !caseId) return;
    setLoading(true);
    setError(null);
    caseApi
      .getReport(investigationId, caseId)
      .then((data) => setReportData(data))
      .catch((err) => {
        console.error(err);
        setError('Failed to generate deterministic case report.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, investigationId, caseId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FINTRACE_CASE_${reportData.case_number || 'REPORT'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityVariant = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'high';
      case 'MEDIUM':
        return 'medium';
      default:
        return 'low';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-fin-border shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fin-border bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-fin-accent">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fin-text">Investigation Case Report</h2>
              <p className="text-2xs text-fin-subtext">Deterministic structured forensic documentation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 text-2xs"
              onClick={handleDownloadJSON}
              disabled={!reportData || loading}
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 text-2xs"
              onClick={handlePrint}
              disabled={!reportData || loading}
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-fin-subtext hover:text-fin-text rounded hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-fin-text">
          {loading ? (
            <div className="py-20 text-center text-fin-subtext font-sans">
              Compiling case report from evidence database...
            </div>
          ) : error || !reportData ? (
            <div className="py-12 text-center text-fin-danger font-sans">
              {error || 'Error loading report data.'}
            </div>
          ) : (
            <div className="space-y-6 print:space-y-4">
              
              {/* Report Header Card */}
              <div className="p-4 rounded-lg bg-slate-50 border border-fin-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-fin-border pb-3">
                  <div>
                    <span className="font-mono text-2xs uppercase text-fin-subtext font-semibold tracking-wider">
                      FINTRACE FORENSIC DOSSIER
                    </span>
                    <h1 className="text-base font-bold text-fin-text mt-0.5">
                      CASE #{reportData.case_number}: {reportData.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant(reportData.severity)}>{reportData.severity}</Badge>
                    <Badge variant="status">{reportData.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs font-mono">
                  <div>
                    <span className="text-fin-subtext block uppercase">Investigation</span>
                    <span className="text-fin-text font-bold font-sans text-xs truncate block">{reportData.investigation_name}</span>
                  </div>
                  <div>
                    <span className="text-fin-subtext block uppercase">Dataset Source</span>
                    <span className="text-fin-text font-bold font-mono text-xs truncate block">{reportData.dataset}</span>
                  </div>
                  <div>
                    <span className="text-fin-subtext block uppercase">Created At</span>
                    <span className="text-fin-text font-bold text-xs block">{new Date(reportData.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-fin-subtext block uppercase">Evidence Count</span>
                    <span className="text-fin-accent font-bold text-xs block">{reportData.signal_count} Signals / {reportData.entity_count} Entities</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fin-text flex items-center gap-1.5 border-b border-fin-border pb-1">
                  <Shield className="h-3.5 w-3.5 text-fin-accent" />
                  1. Executive Summary & Correlation Rationale
                </h3>
                <p className="text-xs text-fin-text leading-relaxed bg-white p-3 rounded border border-fin-borderSubtle">
                  {reportData.summary}
                </p>
              </div>

              {/* Section 2: Correlated Risk Signals */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fin-text flex items-center gap-1.5 border-b border-fin-border pb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  2. Risk Indicators & Anomaly Triggers ({reportData.risk_indicators?.length || 0})
                </h3>
                <div className="overflow-x-auto rounded border border-fin-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-fin-text font-semibold uppercase text-[10px] border-b border-fin-border">
                      <tr>
                        <th className="px-3 py-2">Signal Type</th>
                        <th className="px-3 py-2">Severity</th>
                        <th className="px-3 py-2">Engine</th>
                        <th className="px-3 py-2">Target/Account</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fin-borderSubtle bg-white font-mono text-[11px]">
                      {reportData.risk_indicators && reportData.risk_indicators.length > 0 ? (
                        reportData.risk_indicators.map((ind: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-sans font-semibold text-fin-text">{ind.signal_type}</td>
                            <td className="px-3 py-2">
                              <Badge variant={severityVariant(ind.severity)}>{ind.severity}</Badge>
                            </td>
                            <td className="px-3 py-2 text-fin-subtext font-sans">{ind.source}</td>
                            <td className="px-3 py-2 text-fin-accent">{ind.account || '-'}</td>
                            <td className="px-3 py-2 font-sans text-fin-text max-w-xs">{ind.description}</td>
                            <td className="px-3 py-2 font-bold text-blue-700">{ind.anomaly_score !== null && ind.anomaly_score !== undefined ? ind.anomaly_score : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-fin-muted font-sans">
                            No risk indicators recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Entity Network & Connected Entities */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fin-text flex items-center gap-1.5 border-b border-fin-border pb-1">
                  <Layers className="h-3.5 w-3.5 text-purple-600" />
                  3. Key Entities & Network Relationships
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportData.entities && reportData.entities.length > 0 ? (
                    reportData.entities.map((ent: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded border border-fin-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-2xs uppercase px-1.5 py-0.5 rounded bg-white border border-fin-border font-semibold text-fin-accent">
                            {ent.entity_type}
                          </span>
                          <span className="font-mono text-2xs text-fin-muted">{ent.entity_ref}</span>
                        </div>
                        <p className="font-bold text-xs text-fin-text font-mono">{ent.label}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-3 text-center text-fin-muted">No entities linked.</div>
                  )}
                </div>
              </div>

              {/* Section 4: Timeline Sequence */}
              {reportData.timeline && reportData.timeline.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fin-text flex items-center gap-1.5 border-b border-fin-border pb-1">
                    <Clock className="h-3.5 w-3.5 text-fin-accent" />
                    4. Chronological Event Sequence
                  </h3>
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded border border-fin-border">
                    {reportData.timeline.map((evt: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-xs border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                        <span className="font-mono text-[11px] text-fin-subtext shrink-0 font-semibold bg-white px-1.5 py-0.5 rounded border border-fin-border">
                          {evt.timestamp}
                        </span>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-fin-text">{evt.event}</span>
                            <Badge variant={severityVariant(evt.severity)}>{evt.severity}</Badge>
                          </div>
                          {evt.details && <p className="text-fin-subtext text-2xs leading-relaxed">{evt.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Stamp */}
              <div className="pt-4 border-t border-fin-border flex items-center justify-between text-2xs text-fin-muted font-mono">
                <span>FINTRACE Enterprise Forensic Intelligence</span>
                <span>Generated: {new Date().toUTCString()}</span>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-fin-border bg-slate-50 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};
