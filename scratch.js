require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('goals')
    .select('*, profiles:profile_id(id, first_name, last_name, email, department_id, avatar_url)')
    .eq('status', 'submitted');
    
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();
