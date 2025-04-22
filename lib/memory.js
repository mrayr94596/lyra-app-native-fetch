import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function saveMemory(userId, key, value) {
  const { error } = await supabase
    .from('lyra_memory')
    .upsert({
      user_id: userId,
      memory_key: key,
      memory_value: value,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('🧠 Error saving memory:', error);
    throw error;
  }
}

export async function getMemory(userId, key) {
  const { data, error } = await supabase
    .from('lyra_memory')
    .select('memory_value')
    .eq('user_id', userId)
    .eq('memory_key', key)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('🧠 Error retrieving memory:', error);
    throw error;
  }

  return data?.memory_value || null;
}
