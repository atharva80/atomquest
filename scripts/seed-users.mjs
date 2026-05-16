/**
 * AtomQuest — Seed Users via Supabase Admin API
 * 
 * Direct SQL inserts into auth.users don't work with Supabase's
 * hosted GoTrue. We must use the Admin API to create users properly.
 */

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://sdxyohtmgtxwfzhavqdo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

const users = [
  { email: 'admin@atomberg.com',      password: 'password123', name: 'Sarah Connor',     role: 'admin',    dept: null,                                          empCode: 'ADM001', managerId: null },
  { email: 'hr.head@atomberg.com',     password: 'password123', name: 'Toby Flenderson',  role: 'admin',    dept: 'd4444444-4444-4444-4444-444444444444',         empCode: 'HR001',  managerId: null },
  { email: 'eng.lead@atomberg.com',    password: 'password123', name: 'Michael Scott',    role: 'manager',  dept: 'd1111111-1111-1111-1111-111111111111',         empCode: 'ENG001', managerId: null },
  { email: 'sales.lead@atomberg.com',  password: 'password123', name: 'Jim Halpert',      role: 'manager',  dept: 'd2222222-2222-2222-2222-222222222222',         empCode: 'SAL001', managerId: null },
  { email: 'mktg.lead@atomberg.com',   password: 'password123', name: 'Kelly Kapoor',     role: 'manager',  dept: 'd3333333-3333-3333-3333-333333333333',         empCode: 'MKT001', managerId: null },
  { email: 'dev1@atomberg.com',        password: 'password123', name: 'Dwight Schrute',   role: 'employee', dept: 'd1111111-1111-1111-1111-111111111111',         empCode: 'ENG002', managerEmail: 'eng.lead@atomberg.com' },
  { email: 'dev2@atomberg.com',        password: 'password123', name: 'Angela Martin',    role: 'employee', dept: 'd1111111-1111-1111-1111-111111111111',         empCode: 'ENG003', managerEmail: 'eng.lead@atomberg.com' },
  { email: 'dev3@atomberg.com',        password: 'password123', name: 'Kevin Malone',     role: 'employee', dept: 'd1111111-1111-1111-1111-111111111111',         empCode: 'ENG004', managerEmail: 'eng.lead@atomberg.com' },
  { email: 'sales1@atomberg.com',      password: 'password123', name: 'Stanley Hudson',   role: 'employee', dept: 'd2222222-2222-2222-2222-222222222222',         empCode: 'SAL002', managerEmail: 'sales.lead@atomberg.com' },
  { email: 'sales2@atomberg.com',      password: 'password123', name: 'Phyllis Vance',    role: 'employee', dept: 'd2222222-2222-2222-2222-222222222222',         empCode: 'SAL003', managerEmail: 'sales.lead@atomberg.com' },
  { email: 'mktg1@atomberg.com',       password: 'password123', name: 'Ryan Howard',      role: 'employee', dept: 'd3333333-3333-3333-3333-333333333333',         empCode: 'MKT002', managerEmail: 'mktg.lead@atomberg.com' },
  { email: 'ops1@atomberg.com',        password: 'password123', name: 'Creed Bratton',    role: 'employee', dept: 'd5555555-5555-5555-5555-555555555555',         empCode: 'OPS001', managerEmail: 'admin@atomberg.com' },
];

async function main() {
  // 1. First, delete existing auth users (clean slate)
  console.log('🧹 Cleaning up existing auth users...');
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  if (existingUsers?.users) {
    for (const u of existingUsers.users) {
      await supabase.auth.admin.deleteUser(u.id);
      console.log(`  Deleted: ${u.email}`);
    }
  }

  // 2. Create users via Admin API
  console.log('\n👤 Creating users via Admin API...');
  const createdUsers = {};

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: u.name }
    });

    if (error) {
      console.error(`  ❌ Failed: ${u.email} — ${error.message}`);
      continue;
    }

    createdUsers[u.email] = data.user.id;
    console.log(`  ✅ Created: ${u.email} → ${data.user.id}`);
  }

  // 3. Update profiles with roles, departments, manager links, employee codes
  console.log('\n📝 Updating profiles...');
  for (const u of users) {
    const userId = createdUsers[u.email];
    if (!userId) continue;

    const managerId = u.managerEmail ? createdUsers[u.managerEmail] : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        role: u.role,
        department_id: u.dept,
        employee_code: u.empCode,
        manager_id: managerId,
        full_name: u.name,
      })
      .eq('id', userId);

    if (error) {
      console.error(`  ❌ Profile update failed: ${u.email} — ${error.message}`);
    } else {
      console.log(`  ✅ Profile: ${u.email} → role=${u.role}, dept=${u.dept || 'none'}`);
    }
  }

  console.log('\n🎉 Seeding complete! You can now log in with:');
  console.log('   Employee: dev1@atomberg.com / password123');
  console.log('   Manager:  eng.lead@atomberg.com / password123');
  console.log('   Admin:    admin@atomberg.com / password123');
}

main().catch(console.error);
