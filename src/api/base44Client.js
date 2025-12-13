// Compatibility shim to ease migration from Base44 SDK to Supabase helpers.
// Exposes `base44.entities.*` and `base44.auth` used across the frontend,
// but under the hood delegates to `src/api/entities.js` and `supabaseClient`.

import * as Entities from './entities';
import { getUser, signOut, signIn, signUp, storageUpload } from './supabaseClient';

export const base44 = {
  entities: {
    Employee: Entities.Employee,
    Document: Entities.Document,
    DocumentType: Entities.DocumentType,
    Equipment: Entities.Equipment,
    EquipmentRequest: Entities.EquipmentRequest,
    Workflow: Entities.Workflow,
    Task: Entities.Task,
    FormTemplate: Entities.FormTemplate,
    DocumentTemplate: Entities.DocumentTemplate,
    Course: Entities.Course,
    CourseAssignment: Entities.CourseAssignment,
    ModuleProgress: Entities.ModuleProgress,
    EquipmentRequestItem: Entities.EquipmentRequestItem
  },
  auth: {
    me: async () => {
      const res = await getUser();
      return res?.data ?? null;
    },
    logout: async () => {
      await signOut();
      return null;
    },
    signIn,
    signUp
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Wrapper: uploads to Supabase storage. Adjust bucket name as needed.
        const uploadPath = `uploads/${Date.now()}-${file.name}`;
        const { data, error } = await storageUpload('course-media', uploadPath, file);
        if (error) throw error;
        // Return object matching previous shape { file_url }
        const publicUrl = `${import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co','')}/storage/v1/object/public/course-media/${uploadPath}`;
        return { file_url: publicUrl, data };
      }
    }
  }
};