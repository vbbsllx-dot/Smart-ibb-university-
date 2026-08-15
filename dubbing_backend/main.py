import os
import urllib.request
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from dubber_engine import ArabicVideoDubber

# تحميل مفاتيح الـ API من ملف .env
load_dotenv()

app = FastAPI(title="Video Dubbing API")

# السماح للواجهة الأمامية بالتخاطب مع هذا الخادم (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # يمكنك تقييد هذا لاحقاً برابط مشروع الـ Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إعداد اتصال قاعدة البيانات Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ تحذير: مفاتيح Supabase غير موجودة في ملف .env")

# تهيئة عميل Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# الهيكل البياني الذي يصل من الـ React (Next.js)
class DubbingRequest(BaseModel):
    task_id: str
    video_url: str

def process_video_task(task_id: str, video_url: str):
    """العملية التي ستعمل في الخلفية دون تعطيل الواجهة"""
    workspace = "workspace"
    task_workspace = os.path.join(workspace, task_id)
    os.makedirs(task_workspace, exist_ok=True)
    
    local_video_path = os.path.join(task_workspace, f"original_{task_id}.mp4")
    final_video = os.path.join(task_workspace, f"dubbed_{task_id}.mp4")
    
    try:
        print(f"[{task_id}] جارٍ تحميل الفيديو من Supabase...")
        urllib.request.urlretrieve(video_url, local_video_path)

        print(f"[{task_id}] بدء المعالجة والدبلجة...")
        dubber = ArabicVideoDubber(task_workspace)
        
        # الخطوة 1: استخراج النص والترجمة
        segments = dubber.process_with_gemini(local_video_path)
        
        # الخطوة 2: العينة المرجعية
        ref_audio = os.path.join(task_workspace, "ref.wav")
        dubber.extract_reference_audio(local_video_path, ref_audio)
        
        # الخطوة 3: توليد الصوت
        tts_dir = os.path.join(task_workspace, "tts_segments")
        dubber.generate_tts_segments(segments, ref_audio, tts_dir)
        
        # الخطوة 4: المحاذاة والدمج
        final_audio = os.path.join(task_workspace, "final_audio.wav")
        dubber.align_and_merge_audio(segments, tts_dir, final_audio)
        
        # الخطوة 5: دمج الصوت الجديد مع الفيديو
        dubber.merge_final_video(local_video_path, final_audio, final_video)

        print(f"[{task_id}] جارٍ رفع الفيديو النهائي إلى Supabase Storage...")
        # تأكد من أن الـ Bucket في Supabase اسمه "videos_bucket" أو قم بتغييره هنا
        bucket_name = "videos_bucket" 
        with open(final_video, 'rb') as f:
            supabase.storage.from_(bucket_name).upload(f"dubbed/{task_id}.mp4", f)
        
        dubbed_url = supabase.storage.from_(bucket_name).get_public_url(f"dubbed/{task_id}.mp4")

        print(f"[{task_id}] تحديث قاعدة البيانات بالحالة 'مكتمل'...")
        if supabase:
            supabase.table("dubbing_tasks").update({
                "status": "completed", 
                "dubbed_video_url": dubbed_url
            }).eq("id", task_id).execute()
            
        print(f"[{task_id}] ✅ تمت الدبلجة بنجاح!")

    except Exception as e:
        print(f"[{task_id}] ❌ حدث خطأ: {e}")
        if supabase:
            supabase.table("dubbing_tasks").update({
                "status": "failed"
            }).eq("id", task_id).execute()


@app.get("/")
def read_root():
    return {"status": "Backend is running!", "service": "AI Dubbing"}


@app.post("/api/start-dubbing")
async def start_dubbing(req: DubbingRequest, background_tasks: BackgroundTasks):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")
        
    # تحديث حالة الفيديو في قاعدة البيانات إلى "processing" (قيد المعالجة)
    try:
        supabase.table("dubbing_tasks").update({"status": "processing"}).eq("id", req.task_id).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database Error: {e}")
    
    # تحويل عملية الدبلجة للعمل في الخلفية
    background_tasks.add_task(process_video_task, req.task_id, req.video_url)
    
    # إرجاع استجابة سريعة فورية للـ Next.js
    return {
        "message": "Video dubbing started successfully in the background.",
        "task_id": req.task_id
    }