import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const resetPassword = async (email: string) => {
  const redirectTo = typeof window !== 'undefined' 
    ? `${window.location.origin}/reset-password` 
    : `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
  
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export const updatePassword = async (password: string) => {
  return await supabase.auth.updateUser({ password })
}