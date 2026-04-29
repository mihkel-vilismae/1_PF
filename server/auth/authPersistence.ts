import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AUTH_STATUSES, TWO_FACTOR_STATUSES, createDefaultAuthState, projectPublicAuthState } from './authState.ts';
import type { AuthPersistence, AuthState, AuthStateOverrides } from './authTypes.ts';

const DEFAULT_AUTH_STATE_RELATIVE_PATH = path.join('runtime_data', 'auth', 'auth-state.json');

interface ResolveDefaultAuthStatePathOptions {
  cwd?: string;
}

interface CreateAuthPersistenceOptions {
  filePath?: string;
}

export function resolveDefaultAuthStatePath({ cwd = process.cwd() }: ResolveDefaultAuthStatePathOptions = {}): string {
  return path.join(cwd, DEFAULT_AUTH_STATE_RELATIVE_PATH);
}

export function createAuthPersistence({ filePath = resolveDefaultAuthStatePath() }: CreateAuthPersistenceOptions = {}): AuthPersistence {
  return {
    filePath,
    async load(): Promise<AuthState | null> {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw) as AuthStateOverrides;
        return normalizePersistedAuthState(parsed);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
          return null;
        }
        return createDefaultAuthState({
          status: AUTH_STATUSES.UNKNOWN,
          has_required_files: false,
          requires_2fa: 'unknown',
          two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
          next_action: 'inspect_auth_persistence_failure',
          updatedAt: new Date().toISOString(),
          error: {
            code: 'auth_persistence_load_failed',
            message: 'Persisted auth state could not be loaded safely.',
            detailMessage: (error as Error).message,
          },
        });
      }
    },
    async save(state: AuthState | AuthStateOverrides): Promise<AuthState> {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const safeState = normalizePersistedAuthState(state);
      await fs.writeFile(filePath, `${JSON.stringify(safeState, null, 2)}\n`, 'utf8');
      return safeState;
    },
    async clear(): Promise<void> {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
          throw error;
        }
      }
    },
  };
}

export function normalizePersistedAuthState(state: AuthState | AuthStateOverrides): AuthState {
  const projected = projectPublicAuthState(state);
  if (projected.status === AUTH_STATUSES.AUTHENTICATED) {
    return createDefaultAuthState({
      ...projected,
      status: AUTH_STATUSES.UNKNOWN,
      requires_2fa: 'unknown',
      two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
      next_action: 'verify_provider_session',
      error: {
        code: 'auth_resume_verification_required',
        message: 'Persisted authenticated state requires provider verification before it can be trusted after restart.',
      },
    });
  }
  return createDefaultAuthState(projected);
}
