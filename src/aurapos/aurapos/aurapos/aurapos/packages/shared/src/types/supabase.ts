import { createClient, SupabaseClient, PostgrestFilterBuilder } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * RLS Helpers */
export const setAuth = (accessToken: string): void => {
  supabase.auth.setAuth(accessToken);
};

export const getUser = async (): Promise<{ id: string; email: string | null } | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
};

/**
 * Business‑Scoped Query Utilities */
export const getBusinessId = async (): Promise<string | null> => {
  const { data, error } = await supabase.rpc('get_current_business_id');
  if (error) throw error;
  return data ?? null;
};

export const withBusinessScope = <T>(
  query: PostgrestFilterBuilder<T>
): Promise<PostgrestFilterBuilder<T>> => {
  return getBusinessId().then((businessId) => {
    if (!businessId) {
      throw new Error('Unable to determine business context for RLS');
    }
    return query.eq('business_id', businessId);
  });
};

/**
 * Convenience: execute a business‑scoped query and return data/error */
export const businessQuery = async <T>(
  queryBuilder: (sb: SupabaseClient) => PostgrestFilterBuilder<T>
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const scopedQuery = await withBusinessScope(queryBuilder(supabase));
    const { data, error } = await scopedQuery;
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};