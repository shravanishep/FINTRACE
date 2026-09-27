import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '../UI/Badge';

export interface TimelineEvent {
  timestamp: string;
  event: string;
  details?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  entity?: string;
  event_type?: string;
}

interface GraphicalTimelineProps {
  events: TimelineEvent[];
}

export const GraphicalTimeline: React.FC<GraphicalTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-fin-subtext">
        No timeline events recorded for this case.
      </div>
    );
  }

  const getDotColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-600 border-red-200 ring-red-100';
      case 'HIGH':
        return 'bg-amber-600 border-amber-200 ring-amber-100';
      case 'MEDIUM':
        return 'bg-yellow-600 border-yellow-200 ring-yellow-100';
      default:
        return 'bg-emerald-600 border-emerald-200 ring-emerald-100';
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
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-fin-text uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-fin-accent" />
          Investigation Timeline
        </h3>
        <span className="text-2xs text-fin-subtext font-mono">{events.length} chronological events</span>
      </div>

      {/* Desktop Horizontal Connected Timeline Axis */}
      <div className="hidden sm:block overflow-x-auto pb-4 pt-2">
        <div className="min-w-[650px] relative px-4">
          
          {/* Horizontal Axis Line */}
          <div className="absolute top-[42px] left-8 right-8 h-0.5 bg-slate-300 z-0" />

          {/* Timeline Nodes Grid */}
          <div className="grid grid-flow-col auto-cols-fr gap-4 relative z-10">
            {events.map((evt, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-2 group">
                
                {/* Timestamp Header */}
                <span className="font-mono text-2xs font-semibold text-fin-subtext bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {evt.timestamp}
                </span>

                {/* Node Circle Pin */}
                <div className={`w-5 h-5 rounded-full border-2 ring-4 shadow-sm transition-transform group-hover:scale-110 flex items-center justify-center ${getDotColor(evt.severity)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Event Card Content */}
                <div className="bg-slate-50 border border-fin-border rounded p-2.5 w-full text-left space-y-1 shadow-xs group-hover:border-fin-accent transition-colors">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant={severityVariant(evt.severity)}>{evt.severity}</Badge>
                    {evt.entity && (
                      <span className="font-mono text-[10px] text-fin-accent font-semibold truncate max-w-[80px]">
                        {evt.entity}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-xs text-fin-text line-clamp-1">{evt.event}</p>
                  {evt.details && (
                    <p className="text-[11px] text-fin-subtext line-clamp-2 leading-tight">{evt.details}</p>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile Connected Vertical Timeline */}
      <div className="sm:hidden relative border-l-2 border-slate-300 ml-3 pl-4 space-y-4 pt-1">
        {events.map((evt, idx) => (
          <div key={idx} className="relative text-xs space-y-1">
            <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 ring-2 bg-white ${getDotColor(evt.severity)}`} />
            <div className="flex items-center justify-between text-2xs text-fin-subtext font-mono">
              <span>{evt.timestamp}</span>
              <Badge variant={severityVariant(evt.severity)}>{evt.severity}</Badge>
            </div>
            <p className="font-semibold text-xs text-fin-text">{evt.event}</p>
            {evt.details && (
              <p className="text-xs text-fin-subtext leading-relaxed">{evt.details}</p>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
