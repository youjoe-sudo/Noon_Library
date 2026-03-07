// Edge Function لإنشاء حساب المدير (Create Admin Account)
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

    // بيانات المدير
    const adminUsername = 'Admin';
    const adminEmail = 'Admin@miaoda.com';
    const adminPassword = 'Noon.admin';

    // التحقق من وجود المستخدم
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email, role')
      .eq('username', adminUsername)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'حساب المدير موجود بالفعل',
          admin: {
            id: existingProfile.id,
            username: existingProfile.username,
            email: existingProfile.email,
            role: existingProfile.role,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // إنشاء المستخدم في Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // تأكيد البريد الإلكتروني تلقائياً
      user_metadata: {
        username: adminUsername,
      },
    });

    if (authError) {
      console.error('خطأ في إنشاء المستخدم:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'فشل إنشاء حساب المدير',
          details: authError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'لم يتم إنشاء المستخدم',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // تحديث الملف الشخصي بدور admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: adminUsername,
        email: adminEmail,
        role: 'admin',
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('خطأ في تحديث الملف الشخصي:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'فشل تحديث الملف الشخصي',
          details: profileError.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // إرجاع النتيجة
    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء حساب المدير بنجاح',
        admin: {
          id: authData.user.id,
          username: adminUsername,
          email: adminEmail,
          role: 'admin',
        },
        credentials: {
          username: adminUsername,
          password: adminPassword,
          email: adminEmail,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('خطأ غير متوقع:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ غير متوقع',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
