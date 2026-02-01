# ⚡ إصلاح فوري - 3 خطوات فقط!

## 🎯 المشكلة تم حلها!

تم إصلاح المشكلة الدائرية في RLS. الآن اتبع هذه الخطوات:

---

## 1️⃣ امسح كل شيء

افتح Console (اضغط F12) واكتب:

```javascript
localStorage.clear()
sessionStorage.clear()
indexedDB.deleteDatabase('supabase-auth-token')
location.reload()
```

---

## 2️⃣ أغلق المتصفح

```
✓ أغلق جميع النوافذ
✓ انتظر 5 ثوانٍ
✓ افتح المتصفح مرة أخرى
```

---

## 3️⃣ سجل الدخول

```
/login

Username: Admin
Password: Noon.admin
```

---

## ✅ تحقق من النجاح

```
/test-permissions

يجب أن ترى:
✅ الملف الشخصي محمّل
✅ الدور: مدير
✅ is_admin(): مدير ✓
```

---

## 🎉 ادخل لوحة الإدارة

```
/admin
```

**يجب أن يعمل الآن! 🚀**

---

## 🆘 لا يزال لا يعمل؟

جرب هذا في Console:

```javascript
// مسح شامل
localStorage.clear()
sessionStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})

// اذهب للتسجيل
location.href = '/login'
```

ثم سجل الدخول مرة أخرى.

---

**ابدأ الآن: افتح Console (F12) 🚀**
