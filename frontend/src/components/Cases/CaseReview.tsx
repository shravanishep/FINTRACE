import React, { useState } from 'react';
import { Case } from '../../types';
import { FolderKanban, FileText } from 'lucide-react';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { caseApi } from '../../services/api';
import { EvidencePanel } from './EvidencePanel';
import { GraphicalTimeline } from './GraphicalTimeline';
import { ReportModal } from './ReportModal';

interface CaseReviewProps {
  investigationId: string;
  cases: Case[];
  onCaseUpdated?: () => void;
}

export const CaseReview: React.FC<CaseReviewProps> = ({
  investigationId,
  cases,
  onCaseUpdated,
}) => {
  const [selectedCase, setSelectedCase] = useState<Case | null>(cases[0] || null);
  const [updating, setUpdating] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCase) return;
    setUpdating(true);
    try {
      const updated = await caseApi.updateStatus(investigationId, selectedCase.id, newStatus);
      setSelectedCase(updated);
      if (onCaseUpdated) onCaseUpdated();
    } catch (err) {
      alert('Failed to update case status');
    } finally {
      setUpdating(false);
    }
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
    <div className="space-y-4 font-sans text-xs">
      <div className="flex items-center justify-between text-fin-subtext">
        <span className="flex items-center gap-1.5 font-bold text-fin-text">
          <FolderKanban className="h-4 w-4 text-fin-accent" />
          Correlated Cases ({cases.length})
        </span>
      </div>

      {cases.length === 0 ? (
        <div className="py-12 text-center text-fin-muted fin-panel bg-white">
          No cases generated yet. Signal correlation engine creates cases when risk triggers share entities or temporal proximity.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Case Selector Panel */}
          <div className="fin-panel bg-white divide-y divide-fin-borderSubtle max-h-[620px] overflow-y-auto">
            {cases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 fin-row cursor-pointer space-y-1.5 transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-l-fin-accent' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-fin-accent">CASE #{c.case_number}</span>
                    <Badge variant={severityVariant(c.severity)}>{c.severity}</Badge>
                  </div>
                  <h4 className="font-semibold text-xs text-fin-text line-clamp-2 leading-snug">
                    {c.title}
                  </h4>
                  <div className="pt-0.5">
                    <span className="text-2xs text-fin-subtext">Status: <strong className="text-fin-text capitalize">{c.status}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Selected Case Detail Area */}
          {selectedCase ? (
            <div className="lg:col-span-2 fin-panel p-5 bg-white space-y-4">
              
              {/* Case Header & Status Bar */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-fin-accent">CASE #{selectedCase.case_number}</span>
                      <Badge variant={severityVariant(selectedCase.severity)}>{selectedCase.severity}</Badge>
                      <Badge variant="status">{selectedCase.status}</Badge>
                    </div>
                    <h2 className="text-sm font-bold text-fin-text">{selectedCase.title}</h2>
                  </div>

                  {/* Actions & Status Bar Buttons */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 text-2xs"
                      onClick={() => setIsReportOpen(true)}
                    >
                      <FileText className="h-3.5 w-3.5 text-fin-accent" />
                      View Dossier Report
                    </Button>

                    <div className="flex items-center gap-1">
                      <span className="text-fin-subtext mr-1 font-medium text-2xs">Status:</span>
                      {['open', 'reviewing', 'escalated', 'closed'].map((st) => (
                        <button
                          key={st}
                          disabled={updating || selectedCase.status === st}
                          onClick={() => handleStatusChange(st)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors border ${
                            selectedCase.status === st
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white border-fin-border text-fin-subtext hover:text-fin-text hover:bg-slate-50'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-fin-subtext leading-relaxed">{selectedCase.description}</p>
              </div>

              <hr className="border-fin-border my-4" />

              {/* Evidence & Connection Trace Component */}
              <EvidencePanel caseData={selectedCase} />

              {selectedCase.timeline && selectedCase.timeline.length > 0 && (
                <>
                  <hr className="border-fin-border my-4" />
                  {/* Graphical Timeline Component */}
                  <GraphicalTimeline events={selectedCase.timeline} />
                </>
              )}

              {/* Report Modal */}
              <ReportModal
                investigationId={investigationId}
                caseId={selectedCase.id}
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
              />

            </div>
          ) : (
            <div className="lg:col-span-2 fin-panel p-12 text-center text-fin-muted text-xs bg-white">
              Select a case from the sidebar to inspect investigation narrative, connection trace, and timeline.
            </div>
          )}

        </div>
      )}
    </div>
  );
};
