/**
 * Soli Workspace — backend API contract (STUB, not yet implemented).
 *
 * The client backend (`soli-client-backend`) currently exposes only
 * auth/users/onboarding endpoints. There is NO workspace, chat, or RAG
 * endpoint yet, so everything in the workspace milestone runs on local
 * in-memory state via `WorkspaceProvider`.
 *
 * When the backend is ready, implement these functions against:
 *   POST /workspaces
 *   GET  /workspaces/:id
 *   PUT  /workspaces/:id
 * and swap the provider's local state for these calls. Component code
 * must NOT change — it only depends on `WorkspaceSnapshot` in `./types`.
 */

import type { WorkspaceSnapshot } from './types';

export const WORKSPACE_API_READY = false;

export async function createWorkspace(): Promise<never> {
  throw new Error('Workspace API not implemented: POST /workspaces does not exist yet.');
}

export async function getWorkspace(_id: string): Promise<never> {
  throw new Error('Workspace API not implemented: GET /workspaces/:id does not exist yet.');
}

export async function saveWorkspace(
  _id: string,
  _snapshot: WorkspaceSnapshot,
): Promise<never> {
  throw new Error('Workspace API not implemented: PUT /workspaces/:id does not exist yet.');
}
