// سكريبت لحذف جميع المستخدمين
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteAllUsers() {
  try {
    console.log('🗑️  جاري حذف جميع المستخدمين...');
    
    const { data, error } = await supabase.functions.invoke('delete-all-users', {
      method: 'POST',
    });

    if (error) {
      console.error('❌ خطأ:', error);
      return;
    }

    console.log('✅ النتيجة:', data);
    console.log(`✅ تم حذف ${data.deleted_count} مستخدم بنجاح`);
    console.log('✅ النظام جاهز لإنشاء أول حساب مدير');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

deleteAllUsers();
