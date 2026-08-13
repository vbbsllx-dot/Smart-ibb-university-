import { NextRequest, NextResponse } from 'next/server';

// 🏛️ مصفوفة الحسابات والصلاحيات الوهمية المحاكية لنظام جامعة إب الأمني
// في الإنتاج الحقيقي، يتم جلب هذه البيانات من جدول الحسابات المؤمن في قاعدة البيانات
const mockUserSession = {
  id: "USR-2026-0012",
  name: "د. خالد العمري",
  role: "DEAN", // 🔑 الرتب المتاحة: SUPER_ADMIN (الجامعة), DEAN (الكلية), CONTROLLER (القسم)
  college: "كلية الهندسة والعمارة", // الكلية التابع لها
  department: "ALL" // ALL تعني كل الأقسام (صلاحية العميد)، أو اسم قسم محدد لموظف الكنترول
};

// 🟢 1. دالة الـ GET: لجلب الدرجات بأمان وحسب الصلاحية
export async function GET(req: NextRequest) {
  try {
    // جلب الكلية والقسم المطلوبين من رابط الطلب (URL Query Parameters)
    const { searchParams } = new URL(req.url);
    const college = searchParams.get('college');
    const department = searchParams.get('department');

    if (!college || !department) {
      return NextResponse.json({ error: "معاملات الطلب غير مكتملة (يرجى تحديد الكلية والقسم)" }, { status: 400 });
    }

    // 🛡️ جدار الفحص الأمني المطبّق في السيرفر الخلفي:
    const currentUser = mockUserSession; // محاكاة الـ Session الحالي

    if (currentUser.role === 'SUPER_ADMIN') {
      // الكنترول المركزي للجامعة يمر بدون قيود
    } else if (currentUser.role === 'DEAN') {
      // العميد محصور في كليته فقط ويمنع من استعراض كليات أخرى
      if (currentUser.college !== college) {
        return NextResponse.json({ 
          error: `⚠️ خرق أمني: حسابك مصرح له بالتحكم بـ (${currentUser.college}) فقط. يمنع استعراض الكليات الأخرى!` 
        }, { status: 403 });
      }
    } else if (currentUser.role === 'CONTROLLER') {
      // موظف رصد القسم محصور في قسمه وكليته المحددين بدقة
      if (currentUser.college !== college || currentUser.department !== department) {
        return NextResponse.json({ 
          error: `⚠️ خرق أمني حرج: صلاحياتك محصورة في قسم (${currentUser.department}) فقط!` 
        }, { status: 403 });
      }
    }

    // إذا تجاوز المستخدم الفحص بنجاح، يقوم السيرفر بطلب السجلات من قاعدة البيانات
    // هنا نقوم بإرجاع رسالة نجاح مع السماح بتفريغ الواجهة
    return NextResponse.json({ 
      success: true, 
      message: `تم التحقق الأمني: مسموح لك بالوصول لبيانات قسم ${department}`,
      role: currentUser.role
    });

  } catch (error) {
    return NextResponse.json({ error: "فشل داخلي في معالجة طلب السيرفر" }, { status: 500 });
  }
}

// 🔵 2. دالة الـ PUT: لترحيل واعتماد التعديلات ودرجات الرأفة الجماعية في قاعدة البيانات
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { college, department, students, authorizedBy } = body;

    // 🛡️ جدار فحص الهوية والصلاحيات عند الحفظ والتعديل الجماعي:
    const currentUser = mockUserSession;

    // التأكد من أن الطلب قادم من مستخدم مسجل
    if (!currentUser) {
      return NextResponse.json({ error: "غير مصرح: يرجى تسجيل الدخول للنظام الأمني أولاً" }, { status: 401 });
    }

    // فحص صلاحيات الكتابة والتعديل الكنترولي:
    if (currentUser.role === 'SUPER_ADMIN') {
      // صلاحية مطلقة لاعتماد كشوفات الجامعة كاملة
    } else if (currentUser.role === 'DEAN') {
      // العميد يمكنه اعتماد وتعديل درجات كليته كاملة (بما فيها الرأفة الجماعية)
      if (currentUser.college !== college) {
        return NextResponse.json({ 
          error: `❌ رفض التعديل: لا تملك صلاحية سيادية لتعديل درجات (${college}). حسابك مقيد بـ (${currentUser.college}).` 
        }, { status: 403 });
      }
    } else if (currentUser.role === 'CONTROLLER') {
      // موظف القسم يمنع تماماً من إجراء تعديلات أو رأفة خارج نطاق قسمه المقيد
      if (currentUser.college !== college || currentUser.department !== department) {
        return NextResponse.json({ 
          error: `❌ رفض التعديل: حسابك لا يملك صلاحية تعديل سجلات هذا القسم!` 
        }, { status: 403 });
      }
    }

    // 🚀 خطوة الحقن الفعلي في قاعدة البيانات (مثل Supabase أو PostgreSQL):
    // هنا نكتب كود الاستعلام (Query) لحفظ مصفوفة الطلاب 'students' بعد التعديل أو الرأفة
    // example: await supabase.from('grades').upsert(students);

    return NextResponse.json({ 
      success: true, 
      message: `تم اعتماد وترحيل عدد (${students?.length || 0}) سجل أكاديمي حياً لقاعدة البيانات المركزية لجامعة إب تحت إشراف: ${currentUser.name}`
    });

  } catch (error) {
    return NextResponse.json({ error: "خطأ حرج: فشل ترحيل حزمة البيانات الحالية إلى السيرفر الرئيسي" }, { status: 500 });
  }
}