import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sgxnxbhbyvrmgrzhosyh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG54YmhieXZybWdyemhvc3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MDAzMzMsImV4cCI6MjA3MzQ3NjMzM30.1qS_3Qr-zv7woSyPbkdiLkhuXp2pVHJHGiF3iKWEBkc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpload() {
  const testName = "테스트_" + Date.now();
  
  console.log(`--- Testing Sales Table Insertion ---`);
  const { data: insertData, error: insertError } = await supabase
    .from('sales')
    .insert([
      {
        customer_name: testName,
        branch_name: '본사',
        user_name: '테스트관리자',
        deposit_amount: 1600000,
        payment_method: '카드',
        order_details: '한글 K2 1개 (테스트)',
        created_at: new Date().toISOString()
      }
    ]);
    
  if (insertError) {
    console.error('❌ Insertion failed:', insertError.message);
    return;
  }
  console.log('✅ Insertion success');

  console.log(`--- Testing Dashboard Filter Logic ---`);
  // Dashbaord fetches with filters. Let's try to find our test row.
  const { data: selectData, error: selectError } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_name', testName);

  if (selectError) {
    console.error('❌ Retrieval failed:', selectError.message);
    return;
  }

  if (selectData && selectData.length > 0) {
    console.log('✅ Retrieval success. Found row:', selectData[0].customer_name);
    console.log('✅ Data reflects correctly for dashboard (Branch: ' + selectData[0].branch_name + ')');
  } else {
    console.error('❌ Data not found after insertion');
  }
}

testUpload();
