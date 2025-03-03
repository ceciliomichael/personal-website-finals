import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get feedback
export async function getFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching feedback:', error)
    throw error
  }
  
  return data
}

// Helper function to add feedback
export async function addFeedback(feedback) {
  const { data, error } = await supabase
    .from('feedback')
    .insert([feedback])
    .select()

  if (error) {
    console.error('Error adding feedback:', error)
    throw error
  }

  return data[0]
} 