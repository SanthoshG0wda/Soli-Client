import { apiClient } from './client';

export interface ResearchCitation {
  id: string;
  document_id: string;
  chunk_id: string;
  title: string;
  source: string;
  authority?: string | null;
  section?: string | null;
  page?: string | null;
  excerpt: string;
}

export interface ResearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  act_number?: string | null;
  section_title?: string | null;
  section_number?: string | null;
  content: string;
  final_score: number;
  rank: number;
}

export interface RetrieveResponse {
  query: string;
  query_analysis: {
    query_type: string;
    section_numbers: string[];
    statute_names: string[];
  };
  results: ResearchResult[];
  citations: ResearchCitation[];
  diagnostics: {
    final_count: number;
    total_latency_ms: number;
    methods: string[];
  };
}

export interface RetrieveFilters {
  document_ids?: string[];
  act_number?: string;
  title_contains?: string;
  section_number?: string;
  exclude_toc?: boolean;
  min_word_count?: number;
}

export interface ClarificationPayload {
  question: string;
  options: string[];
  context_hint?: string;
}

export interface ResearchMessagePayload {
  answer: string;
  citations: ResearchCitation[];
  sources: ResearchResult[];
  diagnostics?: Record<string, any>;
}

export interface ResearchRunRequest {
  query: string;
  conversation_id?: string;
  history?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: any[];
  }>;
  workspace_context?: {
    workspace_id?: string;
    selected_node_id?: string;
    selected_evidence_ids?: string[];
    filters?: Record<string, any>;
  };
  top_k?: number;
  filters?: RetrieveFilters;
  // Persistence (server is authoritative when workspace_id is set).
  workspace_id?: string;
  conversation_node_id?: string | null;
  node_title?: string;
  position_x?: number;
  position_y?: number;
  client_request_id?: string;
}

export interface PersistedRunCitation {
  id: string;
  document_id?: string | null;
  chunk_id?: string | null;
  citation_label: string;
  citation_data?: Record<string, any> | null;
}

export interface PersistedRunMessage {
  id: string;
  role: string;
  content: string;
  sequence_number: number;
  response_type?: string | null;
  citations: PersistedRunCitation[];
}

export interface PersistedRunNode {
  id: string;
  title: string;
  query_preview?: string | null;
  response_type: string;
  status: string;
  position_x: number;
  position_y: number;
}

export interface ResearchRunResponse {
  type: 'conversation' | 'research' | 'clarification' | 'evidence' | 'document';
  conversation_id: string;
  message: string | ResearchMessagePayload | ClarificationPayload | Record<string, any>;
  workflow: {
    run_id: string;
    workflow_name: string;
    status: string;
    plan?: {
      goal: string;
      steps: Array<{
        step_index: number;
        type: string;
        description: string;
        status: string;
      }>;
    };
    requires_retrieval: boolean;
  };
  // Present only for persisted runs (workspace_id was supplied).
  workspace_id?: string;
  conversation_node_id?: string;
  message_id?: string;
  node?: PersistedRunNode;
  messages?: PersistedRunMessage[];
}

export async function retrieveResearch(
  query: string,
  top_k = 5,
  filters: RetrieveFilters = {},
): Promise<RetrieveResponse> {
  return apiClient<RetrieveResponse>('/research/retrieve', {
    method: 'POST',
    body: JSON.stringify({ query, top_k, filters }),
  });
}

export async function runResearch(
  payload: ResearchRunRequest,
): Promise<ResearchRunResponse> {
  return apiClient<ResearchRunResponse>('/research/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

