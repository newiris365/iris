const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  const institution_id = 'a0000000-0000-0000-0000-000000000001';
  const student_user_id = 'c93521e6-5238-4460-a952-51227865a012'; // Priyansh Rai

  try {
    console.log('Seeding student profile...');
    const student = {
      id: student_user_id, // Keep unified ID
      user_id: student_user_id,
      institution_id,
      roll_number: '23CSE051',
      department_id: 'd0000000-0000-0000-0000-000000000001', // CSE
      semester: 4,
      batch_year: '2022-2026',
      dob: '2004-05-15',
      gender: 'Male',
      blood_group: 'O+',
      guardian_name: 'Mr. Madanlal Gehlot',
      guardian_phone: '+919829012345',
      address: 'Sardarpura 4th Road, Jodhpur'
    };

    const { error: studentErr } = await supabaseAdmin
      .from('students')
      .upsert(student, { onConflict: 'id' });

    if (studentErr) {
      console.error('Error seeding student:', studentErr);
    } else {
      console.log('Successfully seeded student profile!');
    }

    console.log('Seeding hostel blocks...');
    const block = {
      id: '20000000-0000-0000-0000-000000000001',
      institution_id,
      name: 'Ramanujan Hostel (Boys Block A)',
      type: 'Boys',
      total_rooms: 5,
      warden_id: null // optional
    };

    const { error: blockErr } = await supabaseAdmin
      .from('hostel_blocks')
      .upsert(block, { onConflict: 'id' });

    if (blockErr) {
      console.error('Error seeding block:', blockErr);
    } else {
      console.log('Successfully seeded hostel block!');
    }

    console.log('Seeding hostel rooms...');
    const room = {
      id: '50000000-0000-0000-0000-000000000001',
      institution_id,
      block_id: '20000000-0000-0000-0000-000000000001',
      room_number: 'A-101',
      capacity: 2,
      occupied: 1,
      amenities: ['AC', 'Double Bed', 'Study Table', 'Attached Bathroom'],
      monthly_rent: 7500,
      room_type: 'double'
    };

    const { error: roomErr } = await supabaseAdmin
      .from('hostel_rooms')
      .upsert(room, { onConflict: 'id' });

    if (roomErr) {
      console.error('Error seeding room:', roomErr);
    } else {
      console.log('Successfully seeded hostel room!');
    }

    console.log('Seeding hostel allocations...');
    const allocation = {
      id: '70000000-0000-0000-0000-000000000001',
      institution_id,
      room_id: '50000000-0000-0000-0000-000000000001',
      student_id: student_user_id,
      allotted_date: '2026-06-01',
      is_current: true
    };

    const { error: allocErr } = await supabaseAdmin
      .from('hostel_allocations')
      .upsert(allocation, { onConflict: 'id' });

    if (allocErr) {
      console.error('Error seeding allocation:', allocErr);
    } else {
      console.log('Successfully seeded hostel allocation!');
    }

  } catch (err) {
    console.error('Exception during seeding:', err);
  }
}

seed();
