import { supabaseAdmin } from '../src/config/supabase';

async function checkAlertsTable() {
  try {
    const { data, error } = await supabaseAdmin.from('director_alerts').select('*').limit(1);
    if (error) {
      console.log('❌ Error querying director_alerts:', error);
    } else {
      console.log('✅ Success! Data count:', data.length);
    }
  } catch (e: any) {
    console.log('❌ Exception:', e.message || e);
  }
}

checkAlertsTable();
