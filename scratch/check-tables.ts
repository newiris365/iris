import { supabaseAdmin } from '../src/config/supabase';

async function checkTables() {
  console.log("Checking tables on Supabase...");
  
  const tables = [
    'parent_messages',
    'ptm_bookings',
    'ptm_slots',
    'internships',
    'placement_drives',
    'student_profiles',
    'drive_applications'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}':`, error.message);
      } else {
        console.log(`✅ Table '${table}': exists, data count:`, data.length);
      }
    } catch (e: any) {
      console.log(`❌ Table '${table}': error:`, e.message || e);
    }
  }
}

checkTables();
