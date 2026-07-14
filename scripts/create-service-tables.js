/**
 * Create service_pricing and service_subscriptions tables
 * Run: node scripts/create-service-tables.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INSTITUTION_ID = 'a0000000-0000-0000-0000-000000000001';

async function run() {
  // Create tables using PostgREST admin endpoint
  const sql = `
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

    CREATE TABLE IF NOT EXISTS service_subscriptions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      service_type TEXT NOT NULL CHECK (service_type IN ('hostel', 'transit', 'gym')),
      pricing_id UUID NOT NULL REFERENCES service_pricing(id),
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE NOT NULL,
      amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_service_sub_student ON service_subscriptions(student_id, service_type, status);
    CREATE INDEX IF NOT EXISTS idx_service_pricing_inst ON service_pricing(institution_id, service_type);

    ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;
    ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service_pricing_all" ON service_pricing FOR ALL USING (true);
    CREATE POLICY "service_subscriptions_all" ON service_subscriptions FOR ALL USING (true);
  `;

  // Try using the SQL endpoint
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const data = await res.json();
  console.log('SQL execution result:', JSON.stringify(data));

  if (data.code) {
    console.log('\n--- MANUAL STEP ---');
    console.log('exec_sql RPC not available. Please run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('\n' + sql);
    console.log('-------------------\n');
  }

  // Now seed the pricing data
  console.log('\nSeeding pricing data...');
  const pricingData = [
    { institution_id: INSTITUTION_ID, service_type: 'hostel', name: 'Monthly Hostel Stay', description: 'Access to hostel room, WiFi, common areas', price: 5000, duration_days: 30, features: ['Room Allocation', 'WiFi Access', 'Common Areas', 'Hostel Complaints', 'Leave Requests', 'Visitor Management'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'transit', name: 'Monthly Bus Pass', description: 'Unlimited rides on assigned route', price: 1200, duration_days: 30, features: ['Live Bus Tracking', 'Route Map', 'ETA Predictions', 'Boarding Pass', 'Carbon Offset'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'gym', name: 'Monthly Gym Basic', description: 'Gym floor access with basic equipment', price: 599, duration_days: 30, features: ['Gym Floor Access', 'Basic Equipment', 'Locker Room', 'Workout Logging'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'gym', name: 'Quarterly Gym Prime', description: 'Full gym access with trainer consultations', price: 1499, duration_days: 90, features: ['All Cardio Equipment', 'Trainer Consultation', 'Locker + Shower', 'Progress Dashboard'], is_active: true },
    { institution_id: INSTITUTION_ID, service_type: 'gym', name: 'Annual Gym Pro Elite', description: '24/7 premium gym access with personal locker', price: 4999, duration_days: 365, features: ['24/7 Access', 'All Equipment & Classes', 'Personal Locker', 'Monthly Body Metrics', 'Unlimited Trainer Sessions'], is_active: true },
  ];

  const { data: existing } = await supabase.from('service_pricing').select('id');
  if (existing && existing.length > 0) {
    console.log(`Already have ${existing.length} pricing plans. Skipping seed.`);
  } else {
    const { error } = await supabase.from('service_pricing').insert(pricingData);
    if (error) {
      console.error('Seed error:', error.message);
    } else {
      console.log(`Inserted ${pricingData.length} pricing plans.`);
    }
  }

  // Verify
  const { data: plans } = await supabase.from('service_pricing').select('service_type, name, price');
  console.log('\nPricing plans:');
  if (plans) plans.forEach(p => console.log(`  [${p.service_type}] ${p.name}: ₹${p.price}`));
}

run().catch(console.error);
