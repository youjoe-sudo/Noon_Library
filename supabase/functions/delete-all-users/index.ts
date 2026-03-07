// دالة لحذف جميع المستخدمين من auth.users
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // إنشاء عميل Supabase بصلاحيات service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // الحصول على جميع المستخدمين
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'لا يوجد مستخدمين لحذفهم',
          deleted_count: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // حذف كل مستخدم
    const deletePromises = users.map(user => 
      supabaseAdmin.auth.admin.deleteUser(user.id)
    );

    await Promise.all(deletePromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم حذف ${users.length} مستخدم بنجاح`,
        deleted_count: users.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error deleting users:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
