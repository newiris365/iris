const fs = require('fs');
const path = require('path');

const missingTables = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'missing-tables-schemas.json'), 'utf8')
);

// Type inference helper
function inferColumnType(tableName, columnName) {
  const col = columnName.toLowerCase();
  
  // ID field
  if (col === 'id') {
    return 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
  }
  
  // Foreign Keys (UUID references)
  if (col === 'institution_id') {
    return 'UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE';
  }
  if (col === 'student_id') {
    return 'UUID REFERENCES students(id) ON DELETE CASCADE';
  }
  if (col === 'user_id') {
    return 'UUID REFERENCES users(id) ON DELETE CASCADE';
  }
  if (col === 'staff_id' || col === 'teacher_id') {
    return 'UUID REFERENCES users(id) ON DELETE SET NULL'; // Reference users to be safe or staff
  }
  if (col === 'department_id') {
    return 'UUID REFERENCES departments(id) ON DELETE SET NULL';
  }
  if (col === 'course_id') {
    return 'UUID REFERENCES courses(id) ON DELETE CASCADE';
  }
  if (col === 'program_id') {
    return 'UUID REFERENCES programs(id) ON DELETE CASCADE';
  }
  if (col === 'admission_id') {
    return 'UUID REFERENCES applicants(id) ON DELETE CASCADE';
  }
  if (col === 'block_id') {
    return 'UUID REFERENCES hostel_blocks(id) ON DELETE CASCADE';
  }
  if (col === 'room_id') {
    return 'UUID REFERENCES hostel_rooms(id) ON DELETE CASCADE';
  }
  if (col === 'book_id') {
    return 'UUID REFERENCES books(id) ON DELETE CASCADE';
  }
  if (col === 'event_id') {
    return 'UUID REFERENCES events(id) ON DELETE CASCADE';
  }
  if (col === 'route_id') {
    return 'UUID REFERENCES bus_routes(id) ON DELETE CASCADE';
  }
  if (col === 'bus_id') {
    return 'UUID REFERENCES buses(id) ON DELETE CASCADE';
  }
  if (col === 'wallet_id') {
    return 'UUID REFERENCES canteen_wallets(id) ON DELETE CASCADE';
  }
  if (col === 'notice_id') {
    return 'UUID REFERENCES notices(id) ON DELETE CASCADE';
  }
  if (col === 'exam_id') {
    return 'UUID REFERENCES exams(id) ON DELETE CASCADE';
  }
  if (col === 'result_id') {
    return 'UUID REFERENCES exam_results(id) ON DELETE CASCADE';
  }
  if (col === 'club_id') {
    return 'UUID REFERENCES book_clubs(id) ON DELETE CASCADE';
  }
  if (col === 'assigned_to' || col === 'created_by' || col === 'uploaded_by' || 
      col === 'resolved_by' || col === 'reported_by' || col === 'approved_by' || 
      col === 'marked_by' || col === 'sender_id' || col === 'receiver_id' || 
      col === 'parent_id' || col === 'parent_user_id' || col === 'guard_id' || 
      col === 'original_teacher_id' || col === 'substitute_id' || col === 'added_by') {
    return 'UUID REFERENCES users(id) ON DELETE SET NULL';
  }
  if (col.endsWith('_id') && col !== 'onconflict' && col !== 'id') {
    return 'UUID';
  }
  
  // Date & Time Fields
  if (col === 'created_at' || col === 'updated_at' || col === 'last_updated') {
    return 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP';
  }
  if (col.endsWith('_at') || col.endsWith('_date') || col === 'timestamp' || 
      col === 'last_heartbeat' || col === 'last_serviced' || col === 'last_adjusted' || 
      col === 'enrolled_at' || col === 'marked_safe_at' || col === 'actual_end' || 
      col === 'scheduled_time' || col === 'in_time' || col === 'out_time' || 
      col === 'last_occupied_at' || col === 'expiry_date' || col === 'actioned_at' || 
      col === 'valid_until' || col === 'valid_from' || col === 'deadline' || col === 'due_date' || 
      col === 'paid_date' || col === 'payment_date' || col === 'run_date' || col === 'menu_date' || 
      col === 'trip_date' || col === 'date') {
    
    if (col === 'date' || col === 'run_date' || col === 'menu_date' || col === 'trip_date' || col.endsWith('_date')) {
      return 'DATE';
    }
    return 'TIMESTAMP WITH TIME ZONE';
  }
  
  // Booleans
  if (col.startsWith('is_') || col === 'approved' || col === 'completed' || 
      col === 'was_actioned' || col === 'was_read' || col === 'sent_to_student' || 
      col === 'sent_to_parent' || col === 'is_read' || col === 'is_resolved' || 
      col === 'ai_generated' || col === 'enabled' || col === 'is_enabled' || 
      col === 'show_results' || col === 'has_ac' || col === 'answered' || 
      col === 'is_optional' || col === 'is_dismissed' || col === 'is_veg' || 
      col === 'is_available' || col === 'is_locked_down' || col === 'is_answered' || 
      col === 'is_approved' || col === 'is_used' || col === 'is_blocked' || 
      col === 'is_occupied' || col === 'is_opted_out') {
    return 'BOOLEAN DEFAULT TRUE';
  }
  
  // Decimals (Numeric / Currency)
  if (col === 'amount' || col === 'price' || col === 'balance' || col === 'total_amount' || 
      col === 'paid_amount' || col === 'late_fee' || col === 'price_override' || 
      col === 'estimated_amount' || col === 'actual_amount' || col === 'total_collected' || 
      col === 'marks_obtained' || col === 'previous_marks' || col === 'max_marks' || 
      col === 'co2_saved_kg' || col === 'amount_overdue') {
    return 'DECIMAL(12, 2)';
  }
  
  // Integers
  if (col === 'semester' || col === 'week_number' || col === 'duration_days' || 
      col === 'meals_included' || col === 'used_count' || col === 'points' || 
      col === 'streak_days' || col === 'completed_books' || col === 'target_books' || 
      col === 'pages_read_total' || col === 'upvotes' || col === 'capacity' || 
      col === 'warnings_sent' || col === 'critical_sent' || col === 'students_checked' || 
      col === 'errors_count' || col === 'run_duration_ms' || col === 'passengers_count' || 
      col === 'students_inside' || col === 'staff_inside' || col === 'visitors_inside' || 
      col === 'rating' || col === 'overall_rating' || col === 'delay_minutes' || 
      col === 'passenger_count' || col === 'view_count' || col === 'download_count' || 
      col === 'rotated_count' || col === 'max_file_size_mb' || col === 'file_size_kb' || 
      col === 'threshold_value' || col === 'floor' || col === 'quantity' || col === 'score' ||
      col === 'academic_score' || col === 'attendance_score' || col === 'engagement_score' ||
      col === 'fee_score' || col === 'attended_classes' || col === 'total_classes' ||
      col === 'co2_saved_kg' || col === 'duration_seconds' || col === 'confidence') {
    return 'INTEGER';
  }
  
  // JSONB Fields
  if (col === 'config' || col === 'data' || col === 'options' || col === 'items' || 
      col === 'metadata' || col === 'suggestions' || col === 'records' || 
      col === 'nutritional_summary' || col === 'plan' || col === 'extra_config' || 
      col === 'template_json' || col === 'cost_breakdown' || col === 'revenue_breakdown' || 
      col === 'factors' || col === 'timetable_data' || col === 'raw_payload' || 
      col === 'affected_entities' || col === 'tagged_students' || col === 'archive_urls' || 
      col === 'bookmarks' || col === 'responses' || col === 'members' || col === 'work_types' || 
      col === 'allowed_file_types') {
    return 'JSONB';
  }
  
  // Text & Varchars based on name
  if (col.includes('email')) return 'VARCHAR(255)';
  if (col.includes('phone') || col === 'mobile') return 'VARCHAR(20)';
  if (col.includes('url') || col.endsWith('_link') || col.includes('image') || col.includes('avatar') || col.includes('proof')) return 'TEXT';
  if (col.includes('description') || col.includes('reason') || col.includes('message') || col.includes('query') || col.includes('transcript') || col.includes('notes') || col.includes('remarks') || col.includes('instruction')) return 'TEXT';
  if (col === 'title' || col === 'subject' || col === 'name' || col === 'vehicle_number' || col === 'license_number' || col === 'full_name' || col === 'roll_number' || col === 'pass_number' || col === 'qr_code' || col === 'token_hash' || col === 'template_namespace' || col === 'verification_code') return 'VARCHAR(255)';
  if (col === 'status' || col === 'type' || col === 'category' || col === 'severity' || col === 'priority' || col === 'role' || col === 'plan_tier' || col === 'method' || col === 'direction' || col === 'gender' || col === 'blood_group' || col === 'batch_year' || col === 'quarter' || col === 'year' || col === 'month' || col === 'week_start' || col === 'meter_type' || col === 'firmware_version' || col === 'device_serial' || col === 'device_type' || col === 'api_key' || col === 'device_name' || col === 'device_token' || col === 'action' || col === 'person_type' || col === 'restriction_type' || col === 'alert_type' || col === 'comparison' || col === 'notify_via' || col === 'building' || col === 'hall_name' || col === 'room_number' || col === 'concession_type' || col === 'escalation_stage' || col === 'incident_type' || col === 'location' || col === 'payment_method' || col === 'transaction_id' || col === 'reference_id' || col === 'reference_type' || col === 'nudge_type' || col === 'channel' || col === 'stop_name' || col === 'route_name' || col === 'duration_days' || col === 'day_of_week' || col === 'time_slot' || col === 'unit' || col === 'risk_level' || col === 'intervention_status' || col === 'file_type' || col === 'file_name' || col === 'audio_url' || col === 'language' || col === 'source' || col === 'preferred_role' || col === 'mood' || col === 'provider' || col === 'verify_token' || col === 'from_number' || col === 'phone_number_id' || col === 'access_token') return 'VARCHAR(100)';
  
  // Default fallback
  return 'TEXT';
}

let sqlText = `-- ==========================================================\n`;
sqlText += `-- SECTION: AUTOMATICALLY GENERATED MISSING SCHEMAS\n`;
sqlText += `-- ==========================================================\n\n`;

missingTables.forEach(table => {
  if (table.name.toLowerCase() === 'onconflict') return; // ignore bug references if any
  
  // Clean column list: filter out any invalid columns like onconflict or number keys
  const cols = table.columns.filter(c => c.toLowerCase() !== 'onconflict' && !/^\d+$/.test(c));
  
  // Ensure 'id' is in columns
  if (!cols.map(c => c.toLowerCase()).includes('id')) {
    cols.unshift('id');
  }
  
  // Ensure 'created_at' is in columns if there's no timestamp/created_at
  const lowerCols = cols.map(c => c.toLowerCase());
  if (!lowerCols.includes('created_at') && !lowerCols.includes('timestamp')) {
    cols.push('created_at');
  }
  if (!lowerCols.includes('updated_at') && !lowerCols.includes('last_updated')) {
    cols.push('updated_at');
  }

  sqlText += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
  const columnDefs = cols.map(col => {
    const type = inferColumnType(table.name, col);
    return `    ${col} ${type}`;
  });
  
  sqlText += columnDefs.join(',\n');
  sqlText += `\n);\n\n`;
  
  // Add RLS
  sqlText += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n`;
  
  // RLS Policy
  const hasInstId = cols.map(c => c.toLowerCase()).includes('institution_id');
  const hasStudentId = cols.map(c => c.toLowerCase()).includes('student_id');
  
  if (hasInstId) {
    sqlText += `DROP POLICY IF EXISTS ${table.name}_policy ON ${table.name};\n`;
    sqlText += `CREATE POLICY ${table.name}_policy ON ${table.name}\n`;
    sqlText += `    FOR ALL USING (institution_id = get_auth_institution_id() OR get_auth_user_role() = 'SuperAdmin');\n`;
    sqlText += `CREATE INDEX IF NOT EXISTS idx_${table.name}_inst ON ${table.name}(institution_id);\n`;
  } else if (hasStudentId) {
    sqlText += `DROP POLICY IF EXISTS ${table.name}_policy ON ${table.name};\n`;
    sqlText += `CREATE POLICY ${table.name}_policy ON ${table.name}\n`;
    sqlText += `    FOR ALL USING (student_id IN (SELECT id FROM students WHERE institution_id = get_auth_institution_id()) OR get_auth_user_role() = 'SuperAdmin');\n`;
    sqlText += `CREATE INDEX IF NOT EXISTS idx_${table.name}_student ON ${table.name}(student_id);\n`;
  } else {
    // Standard access policy
    sqlText += `DROP POLICY IF EXISTS ${table.name}_policy ON ${table.name};\n`;
    sqlText += `CREATE POLICY ${table.name}_policy ON ${table.name}\n`;
    sqlText += `    FOR ALL USING (true);\n`; // Default open or check user session
  }
  
  sqlText += `\n----------------------------------------------------------\n\n`;
});

fs.writeFileSync(path.join(__dirname, 'missing_tables.sql'), sqlText, 'utf8');
console.log('Successfully drafted missing_tables.sql.');
