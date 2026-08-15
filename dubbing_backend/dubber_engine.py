import os
import json
import time
import math
import logging
import subprocess
import asyncio
from typing import List, Dict, Any
import edge_tts
from google import genai
from google.genai import types
from pydub import AudioSegment
from pydub.effects import speedup

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(funcName)s] - %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

class ArabicVideoDubber:
    def __init__(self, workspace_dir: str):
        self.workspace = workspace_dir
        
        # قراءة المفتاح من بيئة التشغيل (.env) بدلاً من الملف النصي
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("مفتاح GEMINI_API_KEY غير موجود في متغيرات البيئة.")

        self.client = genai.Client(api_key=self.api_key)

    def process_with_gemini(self, video_path: str, max_retries: int = 5) -> List[Dict[str, Any]]:
        logger.info("جاري حساب مدة الفيديو لتقسيمه بذكاء...")
        try:
            result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path], stdout=subprocess.PIPE, text=True, check=True)
            total_duration = float(result.stdout.strip())
        except Exception as e:
            logger.warning(f"تعذر حساب المدة، سيتم افتراض المعالجة كقطعة واحدة: {e}")
            total_duration = 0

        chunk_size = 600.0
        chunks_count = max(1, math.ceil(total_duration / chunk_size)) if total_duration > 0 else 1
        all_processed_segments = []

        prompt = """أنت خبير في تفريغ الصوتيات والترجمة السينمائية الاحترافية للدبلجة (Dubbing & Subtitling).
مهمتك هي استخراج النص من الملف الصوتي، وترجمته إلى العربية مع التشكيل، وإخراج النتيجة كـ JSON.
تعليمات وطريقة الحساب (صارمة جداً):
1. قاعدة التوقيتات: اكتب التوقيت بصيغة (MM:SS.mmm).
2. حساب المدة: احسب المدة الزمنية بالثواني بين end_time و start_time وضِع الناتج في حقل "duration_seconds".
3. التكييف الزمني للترجمة: صيغ الترجمة العربية بحيث يكون عدد الكلمات مناسباً للمدة المتاحة.
"""
        config = types.GenerateContentConfig(response_mime_type="application/json")

        def parse_time_to_seconds(time_val):
            if isinstance(time_val, (int, float)): return float(time_val)
            if isinstance(time_val, str):
                if ':' in time_val:
                    parts = time_val.split(':')
                    if len(parts) == 3: return int(parts[0])*3600 + int(parts[1])*60 + float(parts[2])
                    elif len(parts) == 2: return int(parts[0])*60 + float(parts[1])
                return float(time_val)
            return 0.0

        for i in range(chunks_count):
            start_time_offset = i * chunk_size
            chunk_audio_path = os.path.join(self.workspace, f"temp_chunk_{i}.mp3")
            subprocess.run(["ffmpeg", "-y", "-i", video_path, "-ss", str(start_time_offset), "-t", str(chunk_size), "-vn", "-acodec", "libmp3lame", "-q:a", "5", chunk_audio_path], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            media_file = self.client.files.upload(file=chunk_audio_path)
            try:
                while media_file.state.name == "PROCESSING":
                    time.sleep(10)
                    media_file = self.client.files.get(name=media_file.name)
                if media_file.state.name == "FAILED": raise RuntimeError("فشلت معالجة الملف الصوتي.")

                chunk_success = False
                for attempt in range(max_retries):
                    try:
                        response = self.client.models.generate_content(model='gemini-2.5-flash', contents=[media_file, prompt], config=config)
                        raw_json = json.loads(response.text)

                        for seg in raw_json:
                            real_start = parse_time_to_seconds(seg.get("start_time", 0)) + start_time_offset
                            real_end = parse_time_to_seconds(seg.get("end_time", 0)) + start_time_offset

                            all_processed_segments.append({
                                "start_time": round(real_start, 3),
                                "end_time": round(real_end, 3),
                                "original_text": seg.get("original_text", ""),
                                "arabic_diacritized": seg.get("arabic_diacritized", "")
                            })
                        chunk_success = True
                        break
                    except Exception as e:
                        time.sleep(10)
                if not chunk_success: raise ValueError(f"فشل التحليل للجزء {i+1}")
            finally:
                try:
                    self.client.files.delete(name=media_file.name)
                    if os.path.exists(chunk_audio_path):
                        os.remove(chunk_audio_path)
                except: pass

        return all_processed_segments

    def extract_reference_audio(self, video_path: str, output_path: str):
        logger.info("استخراج العينة الصوتية المرجعية...")
        subprocess.run(["ffmpeg", "-y", "-i", video_path, "-ss", "00:00:15", "-t", "8", "-ar", "22050", "-ac", "1", output_path], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def generate_tts_segments(self, segments_json: List[Dict[str, Any]], reference_audio_path: str, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        voice_name = "ar-EG-SalmaNeural"

        async def generate_async():
            for index, segment in enumerate(segments_json):
                text = segment.get("arabic_diacritized")
                out_file = os.path.join(output_dir, f"segment_{index}.wav")

                if text and not os.path.exists(out_file):
                    logger.info(f"توليد المقطع رقم: {index} عبر Edge-TTS...")
                    temp_mp3 = out_file.replace(".wav", ".mp3")
                    try:
                        communicate = edge_tts.Communicate(text, voice_name)
                        await communicate.save(temp_mp3)
                        subprocess.run(["ffmpeg", "-y", "-i", temp_mp3, "-ar", "22050", "-ac", "1", out_file], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                        if os.path.exists(temp_mp3): os.remove(temp_mp3)
                    except Exception as e:
                        logger.error(f"خطأ في توليد المقطع {index}: {e}")

        asyncio.run(generate_async())

    def align_and_merge_audio(self, segments_json: List[Dict[str, Any]], audio_segments_dir: str, final_output_path: str):
        logger.info("بدء المحاذاة الزمنية وضبط الإيقاع...")
        final_audio = AudioSegment.empty()
        current_time_ms = 0.0

        for index, segment in enumerate(segments_json):
            start_ms = int(float(segment["start_time"]) * 1000)
            if index + 1 < len(segments_json):
                next_start_ms = int(float(segments_json[index + 1]["start_time"]) * 1000)
            else:
                end_ms = int(float(segment["end_time"]) * 1000)
                next_start_ms = max(end_ms, start_ms + 2000)

            max_available_space_ms = next_start_ms - start_ms
            if max_available_space_ms <= 0: continue

            seg_path = os.path.join(audio_segments_dir, f"segment_{index}.wav")
            if start_ms > current_time_ms:
                final_audio += AudioSegment.silent(duration=start_ms - current_time_ms)
                current_time_ms = start_ms

            if os.path.exists(seg_path):
                audio_seg = AudioSegment.from_wav(seg_path)
                actual_ms = len(audio_seg)
                required_ratio = actual_ms / max_available_space_ms
                final_speed = max(1.0, min(required_ratio, 1.40))

                if final_speed > 1.05 and actual_ms > 200:
                    audio_seg = speedup(audio_seg, playback_speed=final_speed, chunk_size=50, crossfade=25)

                if len(audio_seg) > max_available_space_ms:
                    audio_seg = audio_seg[:int(max_available_space_ms)]

                final_audio += audio_seg
                current_time_ms += len(audio_seg)

        final_audio.export(final_output_path, format="wav")

    def merge_final_video(self, original_video_path: str, final_audio_path: str, output_video_path: str):
        logger.info("الدمج النهائي للفيديو والصوت...")
        subprocess.run(["ffmpeg", "-y", "-i", original_video_path, "-i", final_audio_path, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-map", "0:v:0", "-map", "1:a:0", "-shortest", output_video_path], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)