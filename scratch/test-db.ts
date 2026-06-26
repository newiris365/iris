import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Testing connection to Supabase url:', url);
if (!url || !key) {
  console.error('Missing URL or Service Role Key!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  try {
    const { data, error } = await supabase.from('institutions').select('*').limit(1);
    if (error) {
      console.error('Error fetching institutions:', error.message);
    } else {
      console.log('Successfully fetched institutions:', data);
    }
  } catch (err: any) {
    console.error('Unhandled connection error:', err.message || err);
  }
}

test();
