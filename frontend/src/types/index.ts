export interface User {
  username: string;
  role: string;
}

export interface InvestigationSummary {
  id: string;
  name: string;
  description?: string;
  status: 'created' | 'uploading' | 'validating' | 'preprocessing' | 'analyzing' | 'completed' | 'error';
  total_transactions: number;
  total_signals: number;
  total_cases: number;
  total_entities: number;
  created_at: string;
  updated_at: string;
  dataset_filename?: string;
}

export interface DatasetMeta {
  id: string;
  original_filename: string;
  file_size_bytes: number;
  row_count?: number;
  column_names?: string[];
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors?: string[];
  sample_rows?: Record<string, any>[];
  uploaded_at: string;
}

export interface InvestigationDetail extends InvestigationSummary {
  created_by: string;
  dataset?: DatasetMeta;
}

export interface DashboardStats {
  total_investigations: number;
  active_cases: number;
  total_signals: number;
  total_entities: number;
  recent_investigations: InvestigationSummary[];
}

export interface Signal {
  id: string;
  signal_type: string;
  source: 'rule_engine' | 'ml_engine';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score?: number;
  entity_id?: string;
  description: string;
  evidence?: any;
  metadata_json?: any;
  created_at: string;
}

export interface Case {
  id: string;
  case_number: number;
  title: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'open' | 'reviewing' | 'escalated' | 'closed';
  explanation?: string;
  timeline?: any[];
  evidence_summary?: any;
  created_at: string;
  updated_at: string;
  signal_count: number;
  entity_count: number;
}

export interface Entity {
  id: string;
  entity_type: 'ACCOUNT' | 'BANK' | 'CUSTOMER' | 'EMPLOYEE' | 'TRANSACTION';
  entity_ref: string;
  label?: string;
  properties?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  entity_type: string;
  label: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship_type: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
