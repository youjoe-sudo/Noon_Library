# 🎯 الأوامر الدقيقة - انسخ والصق!

## ⚡ افتح Console الآن (F12)

---

## 📋 الأمر 1: مسح كل شيء

**انسخ هذا والصقه في Console:**

```javascript
localStorage.clear()
sessionStorage.clear()
indexedDB.deleteDatabase('supabase-auth-token')
console.log('✅ تم مسح كل شيء!')
location.reload()
```

---

## 🔄 الخطوة 2: بعد إعادة التحميل

1. **أغلق المتصفح تماماً**
2. **انتظر 5 ثوانٍ**
3. **افتح المتصفح مرة أخرى**

---

## 🔑 الخطوة 3: سجل الدخول

اذهب إلى:
```
/login
```

أدخل:
```
اسم المستخدم: Admin
كلمة المرور: Noon.admin
```

---

## ✅ الخطوة 4: تحقق

اذهب إلى:
```
/test-permissions
```

يجب أن ترى:
```
✅ حالة تسجيل الدخول
✅ الملف الشخصي
✅ اختبار is_admin(): مدير ✓
```

---

## 🎉 الخطوة 5: ادخل لوحة الإدارة

اذهب إلى:
```
/admin
```

**يجب أن يعمل الآن! 🚀**

---

## 🆘 إذا لم يعمل - الأمر الشامل

**انسخ هذا والصقه في Console:**

```javascript
// مسح شامل لكل شيء
localStorage.clear()
sessionStorage.clear()

// مسح جميع الكوكيز
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
})

// مسح IndexedDB
indexedDB.deleteDatabase('supabase-auth-token')

console.log('✅ تم المسح الشامل!')
console.log('🔄 جاري الانتقال إلى صفحة تسجيل الدخول...')

// الانتقال إلى صفحة تسجيل الدخول
setTimeout(() => {
  location.href = '/login'
}, 1000)
```

---

## 🔍 اختبار إضافي (اختياري)

بعد تسجيل الدخول، افتح Console واكتب:

```javascript
// اختبار تحميل الملف الشخصي
supabase.auth.getUser().then(async ({data: {user}}) => {
  if (!user) {
    console.log('❌ لم يتم تسجيل الدخول')
    return
  }
  
  console.log('✅ المستخدم:', user.id)
  
  const {data: profile, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('❌ خطأ:', error)
  } else {
    console.log('✅ الملف الشخصي:', profile)
    console.log('✅ الدور:', profile.role)
  }
  
  // @ts-ignore
  const {data: isAdmin} = await supabase.rpc('is_admin', {uid: user.id})
  console.log('✅ is_admin():', isAdmin)
})
```

**النتيجة المتوقعة:**
```
✅ المستخدم: 3649e482-85a1-4e0f-a327-f5ac6e0afaee
✅ الملف الشخصي: {username: "Admin", email: "Admin@miaoda.com", role: "admin", ...}
✅ الدور: admin
✅ is_admin(): true
```

---

## 📱 للمتصفحات المختلفة

### Chrome / Edge:
```
F12 → Console
```

### Firefox:
```
F12 → Console
```

### Safari:
```
Cmd + Option + C → Console
```

---

## ✅ قائمة التحقق

```
□ فتحت Console (F12)
□ نسخت ولصقت الأمر 1
□ انتظرت إعادة التحميل
□ أغلقت المتصفح
□ انتظرت 5 ثوانٍ
□ فتحت المتصفح
□ ذهبت إلى /login
□ سجلت الدخول: Admin / Noon.admin
□ ذهبت إلى /test-permissions
□ رأيت ✅ في كل شيء
□ ذهبت إلى /admin
□ دخلت بنجاح!
```

---

**ابدأ الآن: اضغط F12 وانسخ الأمر الأول! 🚀**
