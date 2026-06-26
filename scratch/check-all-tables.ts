import { supabaseAdmin } from '../src/config/supabase';

async function checkAllSchemaTables() {
  const tables = [
    'institutions',
    'users',
    'departments',
    'students',
    'staff',
    'attendance_sessions',
    'attendance',
    'timetable',
    'fee_structures',
    'fee_payments',
    'fee_reminders',
    'notices',
    'exams',
    'exam_results',
    'canteen_menus',
    'canteen_wallets',
    'canteen_orders',
    'meal_subscriptions',
    'hostel_blocks',
    'hostel_rooms',
    'hostel_allocations',
    'hostel_complaints',
    'hostel_visitors',
    'books',
    'book_issues',
    'study_room_bookings',
    'events',
    'event_registrations',
    'event_volunteers',
    'event_sponsors',
    'gym_slots',
    'gym_bookings',
    'gym_memberships',
    'equipment_logs',
    'fitness_metrics',
    'workout_sessions',
    'book_reservations',
    'bus_routes',
    'buses',
    'bus_tracking',
    'transport_subscriptions',
    'gate_logs',
    'visitor_logs',
    'security_incidents',
    'notifications',
    'notification_logs',
    'ai_conversations',
    'ai_query_logs',
    'director_alerts',
    'alert_thresholds',
    'ai_insights',
    'parent_messages',
    'ptm_slots',
    'ptm_bookings',
    'student_documents',
    'timetable_history',
    'supplementary_exams',
    're_evaluation_requests',
    'gate_lockdown',
    'student_transit_logs',
    'admission_cycles',
    'programs'
  ];

  console.log("Checking all schema tables on Supabase...");
  const missing: string[] = [];
  const existing: string[] = [];

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error && error.code === 'PGRST205') {
        missing.push(table);
      } else {
        existing.push(table);
      }
    } catch (e: any) {
      missing.push(table);
    }
  }

  console.log("=== EXISTING TABLES ===");
  console.log(existing.join(', '));
  console.log("=== MISSING TABLES ===");
  console.log(missing.join(', '));
}

checkAllSchemaTables();
