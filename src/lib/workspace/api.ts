/**
 * Soli Workspace — backend API layer (PostgreSQL is the source of truth).
 *
 * Every function here maps 1:1 to a domain endpoint under /workspaces.
 * Authentication reuses the existing JWT client — no second mechanism.
 */

import { apiClient } from '../api/client';

export interface WorkspaceSummary {
  id: string;
  organization_id?: string | null;
  owner_user_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCitation {
  id: string;
  message_id: string;
  document_id?: string | null;
  chunk_id?: string | null;
  citation_label: string;
  citation_data?: Record<string, any> | null;
  created_at: string;
}

export interface ApiChatMessage {
  id: string;
  workspace_id: string;
  conversation_node_id: string;
  role: string;
  content: string;
  sequence_number: number;
  response_type?: string | null;
  created_at: string;
  citations: ApiCitation[];
}

export interface ApiConversationNode {
  id: string;
  workspace_id: string;
  title: string;
  query_preview?: string | null;
  response_type: string;
  status: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface ApiEvidenceNode {
  id: string;
  workspace_id: string;
  title: string;
  source_type: string;
  excerpt?: string | null;
  document_id?: string | null;
  chunk_id?: string | null;
  citation_label?: string | null;
  citation_data?: Record<string, any> | null;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface ApiWorkspaceEdge {
  id: string;
  workspace_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship: string;
  created_at: string;
}

export interface WorkspaceDetail extends WorkspaceSummary {
  conversation_nodes: ApiConversationNode[];
  messages: ApiChatMessage[];
  evidence_nodes: ApiEvidenceNode[];
  edges: ApiWorkspaceEdge[];
}

export interface ConversationNodeInput {
  title?: string;
  query_preview?: string;
  response_type?: string;
  status?: string;
  position_x?: number;
  position_y?: number;
}

export interface MessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sequence_number?: number;
  response_type?: string;
  citations?: Array<{
    document_id?: string;
    chunk_id?: string;
    citation_label?: string;
    citation_data?: Record<string, any>;
  }>;
}

export interface EvidenceNodeInput {
  title?: string;
  source_type?: string;
  excerpt?: string;
  document_id?: string;
  chunk_id?: string;
  citation_label?: string;
  citation_data?: Record<string, any>;
  position_x?: number;
  position_y?: number;
}

export interface WorkspaceEdgeInput {
  source_type: 'conversation' | 'evidence';
  source_id: string;
  target_type: 'conversation' | 'evidence';
  target_id: string;
  relationship?: string;
}

export async function listWorkspaces(): Promise<WorkspaceSummary[]> {
  return apiClient<WorkspaceSummary[]>('/workspaces');
}

export async function createWorkspace(title?: string): Promise<WorkspaceSummary> {
  return apiClient<WorkspaceSummary>('/workspaces', {
    method: 'POST',
    body: JSON.stringify({ title: title ?? 'Untitled Research' }),
  });
}

export async function getWorkspace(id: string): Promise<WorkspaceDetail> {
  return apiClient<WorkspaceDetail>(`/workspaces/${id}`);
}

export async function updateWorkspace(
  id: string,
  patch: { title?: string; description?: string },
): Promise<WorkspaceSummary> {
  return apiClient<WorkspaceSummary>(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteWorkspace(id: string): Promise<void> {
  await apiClient<void>(`/workspaces/${id}`, { method: 'DELETE' });
}

export async function createConversationNode(
  workspaceId: string,
  input: ConversationNodeInput,
): Promise<ApiConversationNode> {
  return apiClient<ApiConversationNode>(`/workspaces/${workspaceId}/conversations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateConversationNode(
  workspaceId: string,
  conversationId: string,
  patch: Partial<ConversationNodeInput> & { status?: string },
): Promise<ApiConversationNode> {
  return apiClient<ApiConversationNode>(
    `/workspaces/${workspaceId}/conversations/${conversationId}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
}

export async function deleteConversationNode(
  workspaceId: string,
  conversationId: string,
): Promise<void> {
  await apiClient<void>(
    `/workspaces/${workspaceId}/conversations/${conversationId}`,
    { method: 'DELETE' },
  );
}

export async function createMessage(
  workspaceId: string,
  conversationId: string,
  input: MessageInput,
): Promise<ApiChatMessage> {
  return apiClient<ApiChatMessage>(
    `/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export async function createEvidenceNode(
  workspaceId: string,
  input: EvidenceNodeInput,
): Promise<ApiEvidenceNode> {
  return apiClient<ApiEvidenceNode>(`/workspaces/${workspaceId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateEvidenceNode(
  workspaceId: string,
  evidenceId: string,
  patch: Partial<EvidenceNodeInput>,
): Promise<ApiEvidenceNode> {
  return apiClient<ApiEvidenceNode>(`/workspaces/${workspaceId}/evidence/${evidenceId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteEvidenceNode(
  workspaceId: string,
  evidenceId: string,
): Promise<void> {
  await apiClient<void>(`/workspaces/${workspaceId}/evidence/${evidenceId}`, {
    method: 'DELETE',
  });
}

export async function createWorkspaceEdge(
  workspaceId: string,
  input: WorkspaceEdgeInput,
): Promise<ApiWorkspaceEdge> {
  return apiClient<ApiWorkspaceEdge>(`/workspaces/${workspaceId}/edges`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateWorkspaceEdge(
  workspaceId: string,
  edgeId: string,
  relationship: string,
): Promise<ApiWorkspaceEdge> {
  return apiClient<ApiWorkspaceEdge>(`/workspaces/${workspaceId}/edges/${edgeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ relationship }),
  });
}

export async function deleteWorkspaceEdge(
  workspaceId: string,
  edgeId: string,
): Promise<void> {
  await apiClient<void>(`/workspaces/${workspaceId}/edges/${edgeId}`, {
    method: 'DELETE',
  });
}
