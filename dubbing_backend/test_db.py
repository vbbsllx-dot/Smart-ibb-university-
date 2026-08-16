import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. تحميل المفاتيح من ملف .env
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print("--- بدء فحص الاتصال بقاعدة بيانات Supabase ---")
print(f"URL: {SUPABASE_URL}")
print(f"Key Found: {'نعم ✅' if SUPABASE_KEY else 'لا ❌'}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ خطأ: يرجى التأكد من وجود SUPABASE_URL و SUPABASE_KEY داخل ملف .env")
    exit()

try:
    # 2. إنشاء عميل الاتصال
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 3. اختبار القراءة من جدول dubbing_tasks
    print("\n1. جاري اختبار قراءة البيانات من جدول dubbing_tasks...")
    response = supabase.table("dubbing_tasks").select("*").limit(1).execute()
    print("✅ تم الاتصال والقراءة بنجاح!")
    print(f"بيانات الجدول الحالية: {response.data}")

    # 4. اختبار إضافة سجل وهمي لتجربة الكتابة (Insert)
    print("\n2. جاري اختبار إدراج سجل تجريبي...")
    dummy_task = {
        "original_video_url": "https://test.com/sample_video.mp4",
        "status": "pending"
    }
    insert_response = supabase.table("dubbing_tasks").insert(dummy_task).execute()
    created_id = insert_response.data[0]['id']
    print(f"✅ تم إنشاء سجل تجريبي بنجاح! رقم المهمة (ID): {created_id}")

    # 5. اختبار حذف السجل التجريبي لتنظيف الجدول (Cleanup)
    print("\n3. جاري تنظيف وحذف السجل التجريبي...")
    supabase.table("dubbing_tasks").delete().eq("id", created_id).execute()
    print("✅ تم حذف السجل التجريبي بنجاح.")

    print("\n🎉 تهانينا! الاتصال بقاعدة البيانات وصلاحيات القراءة والكتابة تعمل بنسبة 100%.")

except Exception as e:
    print(f"\n❌ فشل الاتصال بقاعدة البيانات! تفاصيل الخطأ:\n{e}")