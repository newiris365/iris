const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const { data: grievances, error } = await supabase
      .from('grievances')
      .select('*, users!submitted_by(full_name)');
    if (error) throw error;
    console.log("Total Grievances in DB:", grievances.length);
    console.log("Grievances detail:", JSON.stringify(grievances, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();
