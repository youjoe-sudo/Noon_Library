# نظام الشحن الديناميكي (Dynamic Shipping System)

## نظرة عامة
تم تطوير نظام شحن ديناميكي متقدم يحسب تكلفة الشحن تلقائياً بناءً على:
- المحافظة المختارة
- طريقة الشحن (سريع / بريد)
- عدد الكتب في الطلب
- طريقة الدفع (عربون / دفع كامل)

## قواعد التسعير

### 1. التسعير حسب المنطقة

| المنطقة | المحافظات | التكلفة |
|---------|-----------|---------|
| **القاهرة والجيزة** | القاهرة، الجيزة | 60 ج.م |
| **محطات المترو** | محطات المترو | 50 ج.م |
| **وجه بحري والقناة** | الإسكندرية، الدقهلية، الشرقية، القليوبية، كفر الشيخ، الغربية، المنوفية، البحيرة، الإسماعيلية، بورسعيد، السويس، دمياط | 80 ج.م |
| **وجه قبلي** | الفيوم، بني سويف، المنيا، أسيوط، سوهاج، قنا، الأقصر، أسوان | 85 ج.م |
| **المحافظات النائية** | مطروح، شمال سيناء، جنوب سيناء، البحر الأحمر، الوادي الجديد | 120 ج.م |
| **شحن البريد** | جميع المحافظات | 50 ج.م |

### 2. الزيادة التلقائية للكميات الكبيرة
- **القاعدة:** إذا زاد عدد الكتب عن 10 كتب
- **التكلفة الإضافية:** 5 ج.م لكل كتاب إضافي
- **مثال:** طلب 15 كتاب = التكلفة الأساسية + (5 × 5 ج.م) = التكلفة الأساسية + 25 ج.م

### 3. شروط شحن البريد
- **التكلفة:** 50 ج.م فقط (الأرخص)
- **الشرط:** متاح فقط مع الدفع المسبق الكامل
- **إذا اختار العميل شحن بريد مع عربون:** يظهر خطأ "شحن البريد متاح فقط مع الدفع المسبق الكامل"

## البنية التقنية

### جدول قواعد الشحن (shipping_rules)

```sql
CREATE TABLE shipping_rules (
  id UUID PRIMARY KEY,
  region_name TEXT NOT NULL UNIQUE,
  region_type TEXT NOT NULL,
  base_cost DECIMAL(10, 2) NOT NULL,
  governorates TEXT[] NOT NULL,
  requires_prepayment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**الحقول:**
- `region_name`: اسم المنطقة (مثل: "القاهرة والجيزة")
- `region_type`: نوع المنطقة (cairo_giza, metro, lower_egypt, upper_egypt, remote, postal)
- `base_cost`: التكلفة الأساسية
- `governorates`: مصفوفة المحافظات التابعة لهذه المنطقة
- `requires_prepayment`: هل تتطلب دفع مسبق؟

### دالة حساب تكلفة الشحن

```sql
calculate_shipping_cost(
  governorate_param TEXT,      -- المحافظة
  shipping_method_param TEXT,  -- طريقة الشحن (express / postal)
  book_count_param INTEGER,    -- عدد الكتب
  payment_method_param TEXT    -- طريقة الدفع (deposit / full_payment)
)
RETURNS JSON
```

**القيمة المرجعة:**
```json
{
  "success": true,
  "base_cost": 60,
  "extra_cost": 25,
  "total_cost": 85,
  "book_count": 15,
  "message": "تم إضافة 25.00 ج.م لـ 5 كتاب إضافي"
}
```

**في حالة الخطأ:**
```json
{
  "success": false,
  "error": "شحن البريد متاح فقط مع الدفع المسبق الكامل",
  "cost": 0
}
```

### API Functions (src/db/api.ts)

```typescript
// الحصول على جميع قواعد الشحن
getShippingRules(): Promise<ShippingRule[]>

// حساب تكلفة الشحن
calculateShippingCost(
  governorate: string,
  shippingMethod: string,
  bookCount: number,
  paymentMethod: string
): Promise<ShippingCostCalculation>
```

### Types (src/types/types.ts)

```typescript
export interface ShippingRule {
  id: string;
  region_name: string;
  region_type: string;
  base_cost: number;
  governorates: string[];
  requires_prepayment: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingCostCalculation {
  success: boolean;
  base_cost?: number;
  extra_cost?: number;
  total_cost?: number;
  book_count?: number;
  message?: string;
  error?: string;
}
```

## التكامل مع صفحة الدفع (Checkout)

### الحالات الجديدة (State)
```typescript
const [shippingCost, setShippingCost] = useState(0);
const [shippingMessage, setShippingMessage] = useState('');
const [calculatingShipping, setCalculatingShipping] = useState(false);
```

### دالة تحديث تكلفة الشحن
```typescript
const updateShippingCost = async () => {
  const bookCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const governorate = showNewAddress 
    ? formData.governorate 
    : addresses.find(a => a.id === selectedAddressId)?.governorate;

  if (!governorate) return;

  const result = await calculateShippingCost(
    governorate,
    formData.shipping_method,
    bookCount,
    formData.payment_method
  );

  if (result.success) {
    setShippingCost(result.total_cost || 0);
    setShippingMessage(result.message || '');
  } else {
    // عرض رسالة خطأ
    toast({ description: result.error, variant: 'destructive' });
  }
};
```

### التحديث التلقائي
يتم تحديث تكلفة الشحن تلقائياً عند تغيير:
- المحافظة
- طريقة الشحن
- طريقة الدفع
- عدد الكتب في السلة

```typescript
useEffect(() => {
  if (cartItems.length > 0) {
    updateShippingCost();
  }
}, [
  formData.governorate,
  formData.shipping_method,
  formData.payment_method,
  selectedAddressId,
  cartItems.length
]);
```

### عرض تكلفة الشحن في الواجهة

```tsx
<div className="flex justify-between" dir="rtl">
  <span>الشحن:</span>
  <span className="font-semibold">
    {calculatingShipping ? (
      <Loader2 className="h-4 w-4 animate-spin inline" />
    ) : (
      shippingCost === 0 ? 'مجاني' : `${shippingCost.toFixed(2)} ج.م`
    )}
  </span>
</div>
{shippingMessage && (
  <div className="text-xs text-muted-foreground" dir="rtl">
    ℹ️ {shippingMessage}
  </div>
)}
```

## أمثلة الاستخدام

### مثال 1: طلب من القاهرة - 5 كتب
```
المحافظة: القاهرة
طريقة الشحن: سريع
عدد الكتب: 5
طريقة الدفع: عربون

النتيجة:
- التكلفة الأساسية: 60 ج.م
- تكلفة إضافية: 0 ج.م
- الإجمالي: 60 ج.م
- الرسالة: "تكلفة الشحن الأساسية"
```

### مثال 2: طلب من الإسكندرية - 15 كتاب
```
المحافظة: الإسكندرية
طريقة الشحن: سريع
عدد الكتب: 15
طريقة الدفع: عربون

النتيجة:
- التكلفة الأساسية: 80 ج.م
- تكلفة إضافية: 25 ج.م (5 كتب × 5 ج.م)
- الإجمالي: 105 ج.م
- الرسالة: "تم إضافة 25.00 ج.م لـ 5 كتاب إضافي"
```

### مثال 3: شحن بريد مع عربون (خطأ)
```
المحافظة: القاهرة
طريقة الشحن: بريد
عدد الكتب: 5
طريقة الدفع: عربون

النتيجة:
- success: false
- error: "شحن البريد متاح فقط مع الدفع المسبق الكامل"
- يظهر toast بالخطأ
```

### مثال 4: شحن بريد مع دفع كامل (صحيح)
```
المحافظة: القاهرة
طريقة الشحن: بريد
عدد الكتب: 5
طريقة الدفع: دفع كامل

النتيجة:
- التكلفة الأساسية: 50 ج.م
- تكلفة إضافية: 0 ج.م
- الإجمالي: 50 ج.م
- الرسالة: "تكلفة الشحن الأساسية"
```

### مثال 5: محطات المترو
```
المحافظة: محطات المترو
طريقة الشحن: سريع
عدد الكتب: 8
طريقة الدفع: عربون

النتيجة:
- التكلفة الأساسية: 50 ج.م
- تكلفة إضافية: 0 ج.م
- الإجمالي: 50 ج.م
- الرسالة: "تكلفة الشحن الأساسية"
```

### مثال 6: محافظة نائية
```
المحافظة: جنوب سيناء
طريقة الشحن: سريع
عدد الكتب: 3
طريقة الدفع: عربون

النتيجة:
- التكلفة الأساسية: 120 ج.م
- تكلفة إضافية: 0 ج.م
- الإجمالي: 120 ج.م
- الرسالة: "تكلفة الشحن الأساسية"
```

## الأمان والصلاحيات

### Row Level Security (RLS)

```sql
-- الجميع يمكنهم قراءة قواعد الشحن
CREATE POLICY "Anyone can view shipping rules"
  ON shipping_rules FOR SELECT
  USING (true);

-- الإدارة فقط يمكنها تعديل قواعد الشحن
CREATE POLICY "Admins can manage shipping rules"
  ON shipping_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## إدارة قواعد الشحن

### إضافة منطقة جديدة
```sql
INSERT INTO shipping_rules (region_name, region_type, base_cost, governorates, requires_prepayment)
VALUES ('منطقة جديدة', 'custom', 70.00, ARRAY['محافظة 1', 'محافظة 2'], false);
```

### تعديل تكلفة منطقة
```sql
UPDATE shipping_rules
SET base_cost = 65.00
WHERE region_name = 'القاهرة والجيزة';
```

### إضافة محافظة لمنطقة موجودة
```sql
UPDATE shipping_rules
SET governorates = array_append(governorates, 'محافظة جديدة')
WHERE region_name = 'وجه بحري والقناة';
```

## التحسينات المستقبلية

- [ ] لوحة تحكم للإدارة لتعديل قواعد الشحن من الواجهة
- [ ] تكامل مع شركات الشحن للحصول على أسعار فعلية
- [ ] حساب الوزن الفعلي للكتب
- [ ] عروض خاصة على الشحن (شحن مجاني في مناسبات معينة)
- [ ] تتبع الشحنات (Tracking)
- [ ] تقارير تحليلية لتكاليف الشحن

## الاختبارات

تم اختبار جميع السيناريوهات:
- ✅ حساب الشحن لجميع المحافظات
- ✅ الزيادة التلقائية للكتب > 10
- ✅ شحن البريد مع الدفع الكامل
- ✅ منع شحن البريد مع العربون
- ✅ محطات المترو (50 ج.م)
- ✅ المحافظات النائية (120 ج.م)
- ✅ التحديث التلقائي عند تغيير البيانات

## الملاحظات المهمة

1. **العربون = تكلفة الشحن:** يتم حساب العربون المطلوب بناءً على تكلفة الشحن النهائية
2. **التحديث الفوري:** يتم تحديث التكلفة فوراً عند تغيير أي معامل
3. **رسائل واضحة:** يتم عرض رسائل توضيحية للعميل (مثل: "تم إضافة 25 ج.م لـ 5 كتب إضافية")
4. **معالجة الأخطاء:** يتم عرض رسائل خطأ واضحة (مثل: شحن البريد يتطلب دفع مسبق)
5. **السعر الافتراضي:** إذا لم يتم العثور على المحافظة، يتم استخدام 80 ج.م كسعر افتراضي
