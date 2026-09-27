import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphData, GraphNode } from '../../types';
import { Network, ZoomIn, ZoomOut, RefreshCw, Filter, Eye } from 'lucide-react';

interface InteractiveGraphProps {
  data: GraphData;
  onNodeSelect?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  onNodeSelect,
  selectedNodeId,
}) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [focusOnly, setFocusOnly] = useState<boolean>(true); // Focus cluster mode by default!

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 480,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Filter graph data for "Focus Cluster Mode" vs "Show All Graph"
  const filteredData = useMemo(() => {
    if (!focusOnly || data.nodes.length <= 15) {
      return { nodes: data.nodes, links: data.edges };
    }

    // Find suspicious/insider nodes (EMPLOYEE or nodes connected to employee)
    const keyNodeIds = new Set<string>();
    const keyLinks: any[] = [];

    // Prioritize Employee nodes and high degree accounts
    data.nodes.forEach((n) => {
      if (n.entity_type === 'EMPLOYEE' || n.id.includes('E104') || n.id.includes('8000F4580')) {
        keyNodeIds.add(n.id);
      }
    });

    // If no specific employee, take first 12 nodes
    if (keyNodeIds.size === 0) {
      data.nodes.slice(0, 12).forEach((n) => keyNodeIds.add(n.id));
    }

    // Add 1-hop connected neighbors
    data.edges.forEach((edge: any) => {
      const srcId = typeof edge.source === 'object' ? edge.source.id : edge.source;
      const tgtId = typeof edge.target === 'object' ? edge.target.id : edge.target;

      if (keyNodeIds.has(srcId) || keyNodeIds.has(tgtId)) {
        keyNodeIds.add(srcId);
        keyNodeIds.add(tgtId);
        keyLinks.push(edge);
      }
    });

    const filteredNodes = data.nodes.filter((n) => keyNodeIds.has(n.id));
    return { nodes: filteredNodes, links: keyLinks };
  }, [data, focusOnly]);

  // Assign top-to-bottom level coordinates for structured investigation flow
  const structuredData = useMemo(() => {
    const nodes = filteredData.nodes.map((node: any) => {
      let level = 1; // Default Account
      if (node.entity_type === 'EMPLOYEE' || node.id.includes('E104')) level = 0;
      else if (node.entity_type === 'TRANSACTION') level = 2;
      else if (node.entity_type === 'CUSTOMER') level = 3;

      // Assign vertical level position for top-to-bottom flow
      const fy = (level - 1.5) * 110;
      return { ...node, fy: node.fy ?? fy };
    });

    return { nodes, links: filteredData.links };
  }, [filteredData]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'EMPLOYEE':
        return '#D97706'; // Amber / Insider
      case 'CUSTOMER':
        return '#9333EA'; // Purple
      case 'ACCOUNT':
        return '#2563EB'; // Blue / Account
      case 'TRANSACTION':
        return '#16A34A'; // Green
      default:
        return '#64748B';
    }
  };

  const handleNodeClick = (node: any) => {
    const graphNode: GraphNode = {
      id: node.id,
      entity_type: node.entity_type,
      label: node.label,
      properties: node.properties,
    };
    if (onNodeSelect) onNodeSelect(graphNode);

    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 400);
      fgRef.current.zoom(2.2, 400);
    }
  };

  return (
    <div className="space-y-2 font-sans">
      
      {/* Graph Toolbar */}
      <div className="flex items-center justify-between text-xs text-fin-subtext">
        <span className="flex items-center gap-1.5 font-semibold text-fin-text">
          <Network className="h-4 w-4 text-fin-accent" />
          Structured Relationship Map ({structuredData.nodes.length} entities shown)
        </span>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 bg-white px-2.5 py-1 rounded border border-fin-border text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D97706]" /> Employee</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Account</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Transaction</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9333EA]" /> Customer</span>
          </div>

          {/* Focus Toggle */}
          <button
            onClick={() => setFocusOnly(!focusOnly)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition-colors ${
              focusOnly ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-fin-border text-fin-subtext hover:text-fin-text'
            }`}
          >
            <Filter className="h-3 w-3" />
            {focusOnly ? 'Focus Case Cluster' : 'Show All Graph'}
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="relative rounded border border-fin-border bg-[#FAFAFC] overflow-hidden shadow-sm">
        {structuredData.nodes.length === 0 ? (
          <div className="py-24 text-center text-xs text-fin-subtext">
            No graph nodes populated. Execute detection pipeline to construct entity relationship graph.
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={structuredData}
            nodeLabel={(n: any) => `[${n.entity_type}] ${n.label || n.id}`}
            nodeRelSize={7}
            linkColor={(link: any) => {
              if (selectedNodeId) {
                const srcId = typeof link.source === 'object' ? link.source.id : link.source;
                const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
                if (srcId === selectedNodeId || tgtId === selectedNodeId) {
                  return '#2563EB';
                }
                return 'rgba(203, 213, 225, 0.3)';
              }
              return 'rgba(148, 163, 184, 0.6)';
            }}
            linkWidth={(link: any) => {
              if (selectedNodeId) {
                const srcId = typeof link.source === 'object' ? link.source.id : link.source;
                const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
                if (srcId === selectedNodeId || tgtId === selectedNodeId) return 2.5;
              }
              return 1.2;
            }}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={0.95}
            linkLabel={(e: any) => e.relationship_type || 'accessed'}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoverNode(node)}
            backgroundColor="#FAFAFC"
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              if (globalScale < 1.1) return;
              const label = link.relationship_type || 'accessed';
              const start = link.source;
              const end = link.target;
              if (typeof start !== 'object' || typeof end !== 'object') return;

              const textPos = {
                x: start.x + (end.x - start.x) * 0.5,
                y: start.y + (end.y - start.y) * 0.5,
              };

              const fontSize = Math.max(8 / globalScale, 3);
              ctx.font = `${fontSize}px "IBM Plex Sans", sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#64748B';
              ctx.fillText(label, textPos.x, textPos.y);
            }}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label || node.id;
              const type = node.entity_type || 'ACCOUNT';
              const color = getNodeColor(type);
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoverNode?.id === node.id;
              const size = isSelected ? 9 : 7;

              let alpha = 1;
              if (selectedNodeId && !isSelected) {
                const isConnected = structuredData.links.some((l: any) => {
                  const s = typeof l.source === 'object' ? l.source.id : l.source;
                  const t = typeof l.target === 'object' ? l.target.id : l.target;
                  return (s === selectedNodeId && t === node.id) || (t === selectedNodeId && s === node.id);
                });
                if (!isConnected) alpha = 0.25;
              }

              ctx.save();
              ctx.globalAlpha = alpha;

              if (isSelected || isHovered) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI, false);
                ctx.fillStyle = isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(226, 229, 233, 0.6)';
                ctx.fill();
                ctx.strokeStyle = isSelected ? '#2563EB' : '#94A3B8';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }

              ctx.beginPath();
              if (type === 'CUSTOMER') {
                ctx.rect(node.x - size, node.y - size, size * 2, size * 2);
              } else if (type === 'TRANSACTION') {
                ctx.moveTo(node.x, node.y - size * 1.2);
                ctx.lineTo(node.x + size * 1.2, node.y);
                ctx.lineTo(node.x, node.y + size * 1.2);
                ctx.lineTo(node.x - size * 1.2, node.y);
                ctx.closePath();
              } else {
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              }

              ctx.fillStyle = color;
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Readable Entity Type & ID Label
              if (globalScale >= 1.0 || isSelected || isHovered || type === 'EMPLOYEE') {
                const fontSize = Math.max(9 / globalScale, 3.2);
                ctx.font = `600 ${fontSize}px "IBM Plex Sans", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = isSelected ? '#2563EB' : '#17202A';
                ctx.fillText(`[${type}] ${label}`, node.x, node.y + size + 3);
              }

              ctx.restore();
            }}
          />
        )}

        {/* Hover Tooltip */}
        {hoverNode && (
          <div className="absolute top-3 left-3 p-3 rounded bg-white border border-fin-border text-xs text-fin-text shadow-md pointer-events-none space-y-1 z-10 max-w-xs font-sans">
            <div className="flex items-center justify-between border-b border-fin-border pb-1 text-[11px]">
              <span className="font-semibold text-fin-accent uppercase">[{hoverNode.entity_type}]</span>
              <span className="text-fin-muted font-mono">{hoverNode.id}</span>
            </div>
            <p className="text-fin-text font-semibold">{hoverNode.label}</p>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          <button
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300)}
            className="p-1.5 bg-white border border-fin-border rounded text-fin-subtext hover:text-fin-text shadow-sm"
            title="Zoom +"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 300)}
            className="p-1.5 bg-white border border-fin-border rounded text-fin-subtext hover:text-fin-text shadow-sm"
            title="Zoom -"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (onNodeSelect) onNodeSelect(null);
              fgRef.current?.zoomToFit(400);
            }}
            className="p-1.5 bg-white border border-fin-border rounded text-fin-subtext hover:text-fin-text shadow-sm"
            title="Reset / Fit Graph"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
