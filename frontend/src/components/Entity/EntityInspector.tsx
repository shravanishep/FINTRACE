import React from 'react';
import { GraphNode, Signal } from '../../types';
import { User, CreditCard, ShieldAlert, Cpu, Network } from 'lucide-react';
import { Badge } from '../UI/Badge';

interface EntityInspectorProps {
  entity: GraphNode | null;
  associatedSignals?: Signal[];
  onClose?: () => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  entity,
  associatedSignals = [],
  onClose,
}) => {
  if (!entity) {
    return (
      <div className="fin-panel p-6 rounded text-center text-fin-subtext font-sans text-xs space-y-2 bg-white">
        <Network className="h-6 w-6 text-fin-muted mx-auto opacity-40" />
        <p className="font-bold text-fin-text">Entity Inspector</p>
        <p className="text-fin-subtext">Click any node in the relationship map to inspect entity metadata, connected activity, and risk signals.</p>
      </div>
    );
  }

  const isEmployee = entity.entity_type === 'EMPLOYEE';
  const isCustomer = entity.entity_type === 'CUSTOMER';

  return (
    <div className="fin-panel p-4 rounded space-y-4 font-sans text-xs bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fin-border pb-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={isEmployee ? 'medium' : isCustomer ? 'status' : 'info'}>
            {entity.entity_type}
          </Badge>
          <span className="font-bold text-fin-text truncate">{entity.label || entity.id}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-fin-muted hover:text-fin-text text-xs p-1">
            ✕
          </button>
        )}
      </div>

      {/* Entity Attribute Details */}
      <div className="space-y-2 text-xs">
        <div className="p-3 rounded bg-slate-50 border border-fin-border space-y-2">
          <div className="flex items-center justify-between text-fin-subtext">
            <span>Entity Ref ID:</span>
            <strong className="text-fin-text font-mono text-[11px]">{entity.id}</strong>
          </div>
          {entity.properties &&
            Object.entries(entity.properties).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-fin-subtext">
                <span className="capitalize">{k}:</span>
                <strong className="text-fin-text font-semibold truncate max-w-[160px]">{String(v)}</strong>
              </div>
            ))}
        </div>
      </div>

      {/* Associated Signals */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-fin-text flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          Associated Signals ({associatedSignals.length})
        </span>

        {associatedSignals.length === 0 ? (
          <div className="p-3 text-center text-xs text-fin-subtext bg-slate-50 rounded border border-fin-border">
            No direct risk signals mapped to this entity.
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {associatedSignals.map((sig) => (
              <div key={sig.id} className="p-2.5 rounded bg-slate-50 border border-fin-border space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fin-text">{sig.signal_type}</span>
                  <Badge variant={sig.severity === 'CRITICAL' ? 'critical' : sig.severity === 'HIGH' ? 'high' : 'medium'}>
                    {sig.severity}
                  </Badge>
                </div>
                <p className="text-xs text-fin-subtext line-clamp-2 leading-relaxed">{sig.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
