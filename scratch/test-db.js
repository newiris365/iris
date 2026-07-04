const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  try {
    const { data: students, error: err } = await supabaseAdmin
      .from('students')
      .select('id, user_id, roll_number');
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Students in DB:', students);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

test();
