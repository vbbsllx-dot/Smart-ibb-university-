// lib/logger.ts
import { supabase } from '@/lib/supabase';

export const logInstructorAction = async (
  instructorId: string, 
  actionType: 'SAVE_GRADES' | 'UPDATE_ATTENDANCE' | 'CREATE_ASSIGNMENT' | 'SUBMIT_CONTROL', 
  details: string
) => {
  try {
    await supabase.from('audit_logs').insert({
      instructor_id: instructorId,
      action_type: actionType,
      details: details,
    });
  } catch (err) {
    console.error("فشل تسجيل السجل:", err);
  }
};