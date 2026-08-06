const BASE_URL = 'http://127.0.0.1:8000/api/v1/integration';

// 🎯 واجهة بيانات رفع وتكشيف المناهج
export interface SyncCurriculumInput {
  file: File;
  title?: string;
  dep_id?: number | string;
  level_id?: number | string;
  college_id?: string;
  resource_type?: string;
  subject_id?: string;
}

// 🎯 واجهة بيانات المحادثة مع الذكاء الاصطناعي
export interface ChatInput {
  message: string;
  subject_id?: string;
  college_id?: string;
  level_id?: number;
  resource_type?: string;
  thread_id?: string;
}

export const aiService = {
  /**
   * دالة رفع ومزامنة المناهج مع سيرفر FastAPI والتكشيف الفوري بداخل قاعدة المتجهات
   */
  syncCurriculum: async (
    data: SyncCurriculumInput | File,
    legacySubjectId?: string
  ) => {
    try {
      const formData = new FormData();

      if (data instanceof File) {
        // 🟢 دعم الاستدعاء القديم البسيط: syncCurriculum(file, subjectId)
        formData.append('file', data);
        if (legacySubjectId) {
          formData.append('dep_id', legacySubjectId);
          formData.append('subject_id', legacySubjectId);
        }
      } else {
        // 🟢 الاستدعاء المتقدم المزود بكافة بيانات المرجع لربطه بالقسم والمستوى
        formData.append('file', data.file);
        if (data.title) formData.append('title', data.title);
        if (data.dep_id !== undefined) formData.append('dep_id', String(data.dep_id));
        if (data.level_id !== undefined) formData.append('level_id', String(data.level_id));
        if (data.college_id) formData.append('college_id', data.college_id);
        if (data.resource_type) formData.append('resource_type', data.resource_type);
        if (data.subject_id) formData.append('subject_id', data.subject_id);
      }

      const response = await fetch(`${BASE_URL}/curriculum/sync`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`تعذر الرفع والتكشيف بالسيرفر: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('⚠️ خطأ في aiService.syncCurriculum:', error);
      throw error;
    }
  },

  /**
   * دالة إرسال الاستفسارات للوكيل الذكي مع دعم الفلترة حسب القسم والمستوى
   */
  chat: async (
    payload: ChatInput | string,
    subjectId: string = 'GENERAL',
    threadId: string = 'default_session'
  ) => {
    try {
      let bodyData: Record<string, any> = {};

      if (typeof payload === 'string') {
        // 🟢 دعم الاستدعاء البسيط: chat("الرسالة", "المادة", "الجلسة")
        bodyData = {
          message: payload,
          subject_id: subjectId,
          thread_id: threadId,
        };
      } else {
        // 🟢 الاستدعاء المتقدم بالبيانات الكاملة للمكتبة
        bodyData = {
          message: payload.message,
          subject_id: payload.subject_id || 'GENERAL',
          college_id: payload.college_id,
          level_id: payload.level_id,
          resource_type: payload.resource_type,
          thread_id: payload.thread_id || 'default_session',
        };
      }

      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        throw new Error(`تعذر الاتصال بسيرفر الشات: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('⚠️ خطأ في aiService.chat:', error);
      throw error;
    }
  }
};