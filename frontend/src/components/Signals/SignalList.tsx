import React, { useState, useMemo } from 'react';
import { Signal } from '../../types';
import { Radio, AlertTriangle, Cpu, Clock, Search, Filter } from 'lucide-react';
import { Badge } from '../UI/Badge';

interface SignalListProps {
  signals: Signal[];
  onSelectSignal?: (signal: Signal) => void;
}

export const SignalList: React.FC<SignalListProps> = ({ signals, onSelectSignal }) => {
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      // Source filter
      if (filterSource === 'RULE' && sig.source !== 'rule_engine') return false;
      if (filterSource === 'ML' && sig.source !== 'ml_engine') return false;

      // Severity filter
      if (filterSeverity !== 'ALL' && sig.severity !== filterSeverity) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchType = sig.signal_type.toLowerCase().includes(q);
        const matchDesc = sig.description.toLowerCase().includes(q);
        const matchSource = sig.source.toLowerCase().includes(q);
        if (!matchType && !matchDesc && !matchSource) return false;
      }

      return true;
    });
  }, [signals, filterSource, filterSeverity, searchQuery]);

  return (
    <div className="space-y-3 font-sans text-xs">
      
      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-fin-border">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-fin-text text-xs">
            Analyst Signal Stream ({filteredSignals.length} of {signals.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-fin-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search signals..."
              className="bg-slate-50 border border-fin-border rounded pl-8 pr-3 py-1 text-2xs text-fin-text focus:outline-none focus:border-fin-accent"
            />
          </div>

          {/* Source Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-2xs">
            {['ALL', 'RULE', 'ML'].map((src) => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filterSource === src ? 'bg-white text-fin-text shadow-xs font-semibold' : 'text-fin-subtext hover:text-fin-text'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-2xs">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  filterSeverity === sev ? 'bg-white text-fin-text shadow-xs font-semibold' : 'text-fin-subtext hover:text-fin-text'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analyst Signal Table */}
      {filteredSignals.length === 0 ? (
        <div className="py-12 text-center text-xs text-fin-muted fin-panel bg-white">
          No risk signals match the active filters.
        </div>
      ) : (
        <div className="fin-panel bg-white divide-y divide-fin-borderSubtle max-h-[550px] overflow-y-auto">
          {filteredSignals.map((sig) => {
            const isML = sig.source === 'ml_engine';
            return (
              <div
                key={sig.id}
                onClick={() => onSelectSignal && onSelectSignal(sig)}
                className="p-3.5 fin-row flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant(sig.severity)}>{sig.severity}</Badge>
                    
                    <span className="font-semibold text-xs text-fin-text flex items-center gap-1">
                      {isML ? (
                        <Cpu className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      )}
                      {sig.signal_type}
                    </span>

                    {sig.score !== undefined && sig.score !== null && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
                        Score: {sig.score}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-fin-subtext leading-relaxed">{sig.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-fin-subtext shrink-0">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-medium text-fin-text">
                    {isML ? 'Isolation Forest ML' : 'Rule Engine'}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-fin-muted">
                    <Clock className="h-3 w-3 text-fin-muted" />
                    {new Date(sig.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
