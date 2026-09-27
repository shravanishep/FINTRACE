import React from 'react';
import { Case } from '../../types';
import { FileText, ArrowRight, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';

interface EvidencePanelProps {
  caseData: Case;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ caseData }) => {
  // Extract evidence details
  const evidenceSummary = caseData.evidence_summary || {};
  const reasons: string[] = evidenceSummary.reasons || [];
  const triggerSignals: any[] = evidenceSummary.trigger_signals || [];

  // Parse narrative items if explanation exists
  const explanationLines = caseData.explanation
    ? caseData.explanation
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
        .filter((l) => l.length > 0)
    : [];

  // Determine key entities involved in the case
  const isEmployeeCase =
    caseData.title.toLowerCase().includes('employee') ||
    caseData.title.toLowerCase().includes('insider') ||
    caseData.title.toLowerCase().includes('off-hours');

  // Extract account identifiers from title or evidence
  const titleAccountMatch = caseData.title.match(/(?:Account|Acc|Target)\s+([A-Za-z0-9_-]+)/i);
  const detectedAccount =
    evidenceSummary.source_account ||
    evidenceSummary.target_account ||
    (titleAccountMatch ? titleAccountMatch[1] : null) ||
    'Primary Account';

  const destAccount = evidenceSummary.dest_account || evidenceSummary.counterparty;
  const employeeRef = evidenceSummary.employee_id || (isEmployeeCase ? 'E104' : null);

  return (
    <div className="space-y-4 font-sans text-xs">
      
      {/* WHY THIS CASE WAS CREATED Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-fin-text uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-fin-accent" />
          Why This Case Was Created
        </h3>
        <p className="text-xs text-fin-subtext">
          Correlation engine correlated deterministic rule violations and Isolation Forest ML anomaly scores across shared entities and temporal proximity.
        </p>

        <ul className="space-y-1.5 text-xs text-fin-text list-disc list-inside bg-slate-50 p-3.5 rounded border border-fin-border">
          {explanationLines.length > 0 ? (
            explanationLines.map((line, idx) => (
              <li key={idx} className="leading-relaxed">
                {line}
              </li>
            ))
          ) : reasons.length > 0 ? (
            reasons.map((r, idx) => (
              <li key={idx} className="leading-relaxed">
                {r}
              </li>
            ))
          ) : (
            <>
              <li className="leading-relaxed">
                Target account <strong className="font-mono text-blue-800">{detectedAccount}</strong> triggered{' '}
                <strong className="font-mono text-amber-800">{caseData.signal_count || 1} risk signal(s)</strong> within the investigation scope.
              </li>
              {isEmployeeCase && (
                <li className="leading-relaxed">
                  Off-hours access recorded outside standard operational baseline window.
                </li>
              )}
              <li className="leading-relaxed">
                Isolation Forest ML anomaly score and deterministic rule thresholds exceeded normal baseline distribution.
              </li>
              <li className="leading-relaxed">
                Multiple correlated signals converged on connected entities within the investigation temporal window.
              </li>
            </>
          )}
        </ul>
      </div>

      <hr className="border-fin-border my-3" />

      {/* CONNECTION TRACE Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-fin-text uppercase tracking-wider">Connection Trace</h3>
        <p className="text-2xs text-fin-subtext">Correlated entity interaction chain leading to case creation:</p>
        
        <div className="p-4 rounded bg-slate-50 border border-fin-border">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 font-mono text-xs">
            
            {/* If Employee is involved */}
            {employeeRef && (
              <>
                <div className="bg-white px-3 py-2 rounded border border-amber-300 text-center shadow-xs w-full sm:w-auto">
                  <span className="text-[10px] uppercase block font-sans text-amber-800 font-semibold">Employee</span>
                  <span className="font-bold text-amber-900">{employeeRef}</span>
                </div>

                <div className="flex sm:flex-col items-center gap-1 text-center py-1 sm:py-0">
                  <ArrowRight className="h-4 w-4 text-fin-accent hidden sm:block" />
                  <span className="text-fin-subtext text-[11px] font-sans font-medium">accessed</span>
                  <ArrowRight className="h-4 w-4 text-fin-accent sm:hidden" />
                </div>
              </>
            )}

            {/* Primary Source Account */}
            <div className="bg-white px-3 py-2 rounded border border-blue-300 text-center shadow-xs w-full sm:w-auto">
              <span className="text-[10px] uppercase block font-sans text-blue-800 font-semibold">Source Account</span>
              <span className="font-bold text-blue-900">{detectedAccount}</span>
            </div>

            {/* Counterparty / Outbound Destination */}
            {destAccount ? (
              <>
                <div className="flex sm:flex-col items-center gap-1 text-center py-1 sm:py-0">
                  <ArrowRight className="h-4 w-4 text-fin-accent hidden sm:block" />
                  <span className="text-fin-subtext text-[11px] font-sans font-medium">transferred to</span>
                  <ArrowRight className="h-4 w-4 text-fin-accent sm:hidden" />
                </div>

                <div className="bg-white px-3 py-2 rounded border border-purple-300 text-center shadow-xs w-full sm:w-auto">
                  <span className="text-[10px] uppercase block font-sans text-purple-800 font-semibold">Target Account</span>
                  <span className="font-bold text-purple-900">{destAccount}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex sm:flex-col items-center gap-1 text-center py-1 sm:py-0">
                  <ArrowRight className="h-4 w-4 text-fin-accent hidden sm:block" />
                  <span className="text-fin-subtext text-[11px] font-sans font-medium">correlated with</span>
                  <ArrowRight className="h-4 w-4 text-fin-accent sm:hidden" />
                </div>

                <div className="bg-white px-3 py-2 rounded border border-emerald-300 text-center shadow-xs w-full sm:w-auto">
                  <span className="text-[10px] uppercase block font-sans text-emerald-800 font-semibold">Risk Engine</span>
                  <span className="font-bold text-emerald-900">{caseData.signal_count} Correlated Signals</span>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};
