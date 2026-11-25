import type { Json } from '../types/database';

// Helpers for the typed Supabase client (src/types/database.ts).

/**
 * JSONB columns and RPC arguments are typed as Json, which plain interfaces
 * (without an index signature) do not satisfy. Use this at the call site when
 * sending app data that is JSON-serializable.
 */
export const asJson = (value: unknown): Json => value as Json;

/**
 * The type generator marks every SQL function argument as required and
 * non-null, but our functions accept NULL for optional fields. Use this for
 * those arguments instead of inventing placeholder values.
 */
export const nullableArg = <T>(value: T | null): T => value as T;
