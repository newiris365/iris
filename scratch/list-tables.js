const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const { data, error } = await supabase.rpc('get_tables'); // Or query from postgrest
    if (error) {
      // Let's query information_schema.tables using a raw sql query if possible, or query some known tables
      console.log("Error using RPC:", error.message);
    }
    
    // We can run a select on information_schema via RPC if we have a generic sql executor, or we can use another method.
    // Let's run a select on some tables to see what exists.
    const tables = [
      'hostel_complaints', 'grievances', 'students', 'staff', 'users', 'institutions',
      'canteen_menus', 'module_permissions', 'institution_features'
    ];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}' error:`, error.message);
      } else {
        console.log(`Table '${table}' exists!`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
