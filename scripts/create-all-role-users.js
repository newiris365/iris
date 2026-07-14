/**
 * Script: Create all role users in Supabase Auth + public.users table
 * Run: node scripts/create-all-role-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const COLLEGE_ID = 'a0000000-0000-0000-0000-000000000001';
const SCHOOL_ID = 'a0000000-0000-0000-0000-000000000002';
const DEFAULT_PASSWORD = 'password123';

const allUsers = [
  // College Roles (institution_id: COLLEGE_ID)
  { id: 'b0000000-0000-0000-0000-000000000001', name: 'Siddharth Singh', email: 'siddharth@sin.education', role: 'SuperAdmin', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Dr. K. R. Sharma', email: 'director@siet.edu.in', role: 'Admin', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000019', name: 'Director SIET', email: 'director2@siet.edu.in', role: 'Director', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000004', name: 'Dr. Preeti Choudhary', email: 'preeti.c@siet.edu.in', role: 'Student', institution_id: COLLEGE_ID },
  { id: 'c93521e6-5238-4460-a952-51227865a012', name: 'Priyansh Rai', email: 'priyansh.24jics153@jietjodhpur.ac.in', role: 'Student', institution_id: COLLEGE_ID },
  { id: 'ef5191ac-4a49-4fe4-857e-cab44b061c10', name: 'Priyansh Rai', email: 'raipriyansh45@gmail.com', role: 'Teacher', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000003', name: 'Prof. Alok Vyas', email: 'alok.vyas@siet.edu.in', role: 'Teacher', institution_id: COLLEGE_ID },
  { id: '20965bc2-cf59-4ab7-8670-5be0f6ccd53a', name: 'Nakshatra Parihar', email: 'pariharnakshtra21@gmail.com', role: 'Parent', institution_id: COLLEGE_ID },
  { id: 'd9232ba4-271d-4b41-a8c2-e953fb71e764', name: 'Shreyanshi Jangid', email: 'jangidshreyanshi@gmail.com', role: 'Parent', institution_id: COLLEGE_ID },
  { id: '3715b9c1-c961-4543-bd40-181570643c31', name: 'Priyansh Rai', email: 'raip32380@gmail.com', role: 'Driver', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000017', name: 'HOD Member', email: 'hod@sin.education', role: 'HOD', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000012', name: 'Jaswant Singh', email: 'warden@siet.edu.in', role: 'Warden', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000018', name: 'Librarian Head', email: 'librarian@sin.education', role: 'Librarian', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000020', name: 'Canteen Vendor', email: 'canteen@siet.edu.in', role: 'Vendor', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000015', name: 'Guard Sher Singh', email: 'security@siet.edu.in', role: 'Security', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000030', name: 'Faculty Staff Member', email: 'staff@sin.education', role: 'Staff', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000023', name: 'TPO Cell Head', email: 'tpo@siet.edu.in', role: 'TPO', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000024', name: 'IQAC Coordinator', email: 'iqac@sin.education', role: 'IQAC Coordinator', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000025', name: 'Admissions Officer', email: 'admissions@siet.edu.in', role: 'Admissions Officer', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000026', name: 'Gym Trainer', email: 'gym@sin.education', role: 'Gym Trainer', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000027', name: 'HR Admin', email: 'hr@siet.edu.in', role: 'HR Admin', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000028', name: 'Company HR Partner', email: 'companyhr@siet.edu.in', role: 'Company HR', institution_id: COLLEGE_ID },
  { id: 'b0000000-0000-0000-0000-000000000029', name: 'Applicant User', email: 'applicant@sin.education', role: 'Applicant', institution_id: COLLEGE_ID },
  // School Roles (institution_id: SCHOOL_ID)
  { id: 'b0000000-0000-0000-0000-000000000031', name: 'School Admin', email: 'admin@school.edu.in', role: 'Admin', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000032', name: 'School Teacher', email: 'teacher@school.edu.in', role: 'Teacher', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000033', name: 'School Staff', email: 'staff@school.edu.in', role: 'Staff', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000034', name: 'School Student', email: 'student@school.edu.in', role: 'Student', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000035', name: 'School Parent', email: 'parent@school.edu.in', role: 'Parent', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000036', name: 'School Librarian', email: 'librarian@school.edu.in', role: 'Librarian', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000037', name: 'School Warden', email: 'warden@school.edu.in', role: 'Warden', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000038', name: 'School Security', email: 'security@school.edu.in', role: 'Security', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000039', name: 'School Vendor', email: 'canteen@school.edu.in', role: 'Vendor', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000040', name: 'School Driver', email: 'driver@school.edu.in', role: 'Driver', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000041', name: 'School Applicant', email: 'applicant@school.edu.in', role: 'Applicant', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000042', name: 'School Admissions', email: 'admissions@school.edu.in', role: 'Admissions Officer', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000021', name: 'School Principal', email: 'khushalkhatri0019@gmail.com', role: 'Principal', institution_id: SCHOOL_ID },
  { id: 'b0000000-0000-0000-0000-000000000022', name: 'Vice Principal', email: 'khushal.24jiaiml067@jietjodhpur.ac.in', role: 'Vice Principal', institution_id: SCHOOL_ID },
];

async function main() {
  let created = 0, skipped = 0, failed = 0;

  for (const user of allUsers) {
    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name: user.name, role: user.role }
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          console.log(`[SKIP] ${user.email} - already exists in auth`);
          skipped++;
        } else {
          console.error(`[FAIL] ${user.email} - auth error: ${authError.message}`);
          failed++;
          continue;
        }
      } else {
        console.log(`[AUTH] ${user.email} - created in Supabase Auth (id: ${authData.user.id})`);
      }

      // 2. Upsert into public.users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: true,
          institution_id: user.institution_id
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`[FAIL] ${user.email} - profile error: ${profileError.message}`);
        failed++;
      } else {
        console.log(`[PROF] ${user.email} - upserted into users table`);
        created++;
      }
    } catch (err) {
      console.error(`[ERROR] ${user.email} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created/Updated: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total roles: ${allUsers.length}`);
}

main().catch(console.error);
