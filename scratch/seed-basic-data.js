const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  const institution_id = 'a0000000-0000-0000-0000-000000000001';

  try {
    console.log('Seeding departments...');
    const depts = [
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        institution_id,
        name: 'Computer Science & Engineering',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000002',
        institution_id,
        name: 'Electronics & Communication Engineering',
      },
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        institution_id,
        name: 'Mechanical Engineering',
      }
    ];

    const { error: deptErr } = await supabaseAdmin
      .from('departments')
      .upsert(depts, { onConflict: 'id' });

    if (deptErr) {
      console.error('Error seeding departments:', deptErr);
    } else {
      console.log('Successfully seeded departments!');
    }

    console.log('Seeding additional teachers for testing...');
    const teachers = [
      {
        id: 'b0000000-0000-0000-0000-000000000003',
        institution_id,
        role: 'Teacher',
        name: 'Prof. Alok Vyas',
        email: 'alok.vyas@siet.edu.in',
        is_active: true
      },
      {
        id: 'b0000000-0000-0000-0000-000000000004',
        institution_id,
        role: 'Teacher',
        name: 'Dr. Preeti Choudhary',
        email: 'preeti.c@siet.edu.in',
        is_active: true
      }
    ];

    const { error: usersErr } = await supabaseAdmin
      .from('users')
      .upsert(teachers, { onConflict: 'id' });

    if (usersErr) {
      console.error('Error seeding teacher users:', usersErr);
    } else {
      console.log('Successfully seeded teacher users!');
    }

    console.log('Seeding staff profiles...');
    const staff = [
      {
        id: 'd0000000-0000-0000-0000-000000000003',
        user_id: 'b0000000-0000-0000-0000-000000000003',
        institution_id,
        department_id: 'd0000000-0000-0000-0000-000000000001',
        designation: 'Professor & HOD',
        joining_date: '2015-07-01',
        salary: 120000.00,
        qualification: 'Ph.D. in Computer Science & Engineering'
      },
      {
        id: 'd0000000-0000-0000-0000-000000000004',
        user_id: 'b0000000-0000-0000-0000-000000000004',
        institution_id,
        department_id: 'd0000000-0000-0000-0000-000000000002',
        designation: 'Associate Professor',
        joining_date: '2018-01-10',
        salary: 95000.00,
        qualification: 'Ph.D. in VLSI Systems'
      },
      // Link the existing Priyansh Rai Teacher user to CSE staff
      {
        id: 'd0000000-0000-0000-0000-000000000009',
        user_id: 'ef5191ac-4a49-4fe4-857e-cab44b061c10',
        institution_id,
        department_id: 'd0000000-0000-0000-0000-000000000001',
        designation: 'Assistant Professor',
        joining_date: '2022-07-01',
        salary: 60000.00,
        qualification: 'M.Tech in CSE'
      }
    ];

    const { error: staffErr } = await supabaseAdmin
      .from('staff')
      .upsert(staff, { onConflict: 'id' });

    if (staffErr) {
      console.error('Error seeding staff profiles:', staffErr);
    } else {
      console.log('Successfully seeded staff profiles!');
    }

    console.log('Seeding admission_cycles...');
    const cycles = [
      {
        id: 'c1111111-1111-1111-1111-111111111111',
        institution_id,
        name: 'Fall Admissions 2026',
        academic_year: '2026-27',
        start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open'
      },
      {
        id: 'c1111111-1111-1111-1111-111111111112',
        institution_id,
        name: 'Spring Admissions 2027',
        academic_year: '2026-27',
        start_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'upcoming'
      }
    ];

    const { error: cyclesErr } = await supabaseAdmin
      .from('admission_cycles')
      .upsert(cycles, { onConflict: 'id' });

    if (cyclesErr) {
      console.error('Error seeding admission_cycles:', cyclesErr);
    } else {
      console.log('Successfully seeded admission_cycles!');
    }

  } catch (err) {
    console.error('Exception during seeding:', err);
  }
}

seed();
