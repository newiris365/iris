/**
 * Run migration: Create service_pricing and service_subscriptions tables
 * Run: node scripts/run-migration.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const INSTITUTION_ID = 'a0000000-0000-0000-0000-000000000001';

async function run() {
  // Step 1: Create tables via RPC or direct SQL
  console.log('Creating tables...');

  // Try creating service_pricing table
  const { error: e1 } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS service_pricing (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        service_type TEXT NOT NULL CHECK (service_type IN ('hostel', 'transit', 'gym')),
        name TEXT NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        duration_days INTEGER NOT NULL DEFAULT 30,
        features TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(institution_id, service_type, name)
      );
    `
  });

  if (e1) {
    console.log('Note: exec_sql RPC not available. Using Supabase client to create tables via inserts...');
    // Fallback: insert a row which will fail but tell us if table exists
  }

  // Since we can't run raw SQL easily, let's use the REST API to check if tables exist
  // and create them via Supabase Dashboard SQL editor
  console.log('\n--- MANUAL STEP REQUIRED ---');
  console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
  console.log('File: supabase/migrations/20260711000001_service_subscriptions.sql');
  console.log('----------------------------\n');

  // Step 2: Insert default pricing (tables must exist first)
  console.log('Inserting default pricing...');

  const pricingData = [
    { institution_id: INSTITUTION_ID, service_type: 'hostel', name: 'Monthly Hostel Stay', description: 'Access to hostel room, WiFi, common areas', price: 5000, duration_days: 30, features: ['Room Allocation', 'WiFi Access', 'Common Areas', 'Hostel Complaints', 'Leave Requests', 'Visitor Management'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'transit', name: 'Monthly Bus Pass', description: 'Unlimited rides on assigned route', price: 1200, duration_days: 30, features: ['Live Bus Tracking', 'Route Map', 'ETA Predictions', 'Boarding Pass', 'Carbon Offset'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'gym', name: 'Monthly Gym Basic', description: 'Gym floor access with basic equipment', price: 599, duration_days: 30, features: ['Gym Floor Access', 'Basic Equipment', 'Locker Room', 'Workout Logging'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'gym', name: 'Quarterly Gym Prime', description: 'Full gym access with trainer consultations', price: 1499, duration_days: 90, features: ['All Cardio Equipment', 'Trainer Consultation', 'Locker + Shower', 'Progress Dashboard'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'gym', name: 'Annual Gym Pro Elite', description: '24/7 premium gym access with personal locker', price: 4999, duration_days: 365, features: ['24/7 Access', 'All Equipment & Classes', 'Personal Locker', 'Monthly Body Metrics', 'Unlimited Trainer Sessions'], is_active: true },
  ];

  const { data: existing } = await supabase.from('service_pricing').select('id');
  if (existing && existing.length > 0) {
    console.log(`Service pricing already exists (${existing.length} plans). Skipping seed.`);
  } else {
    const { error } = await supabase.from('service_pricing').insert(pricingData);
    if (error) {
      console.error('Error inserting pricing:', error.message);
    } else {
      console.log(`Inserted ${pricingData.length} pricing plans.`);
    }
  }

  // Step 3: Verify
  const { data: plans } = await supabase.from('service_pricing').select('service_type, name, price');
  console.log('\nCurrent pricing plans:');
  if (plans) {
    for (const p of plans) {
      console.log(`  [${p.service_type}] ${p.name}: ₹${p.price}`);
    }
  }

  console.log('\nDone!');
}

run().catch(console.error);
