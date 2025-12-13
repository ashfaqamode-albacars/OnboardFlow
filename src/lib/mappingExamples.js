// src/lib/mappingExamples.js
// Quick generic mapping examples to replace Base44 entity usage with supabase helpers
export const examples = {
  "Workflow.list()": "→ list('workflow', { /* optional opts */ })",
  "Workflow.get(id)": "→ get('workflow', id)",
  "Workflow.create(data)": "→ create('workflow', data)",
  "Workflow.update(id, data)": "→ update('workflow', id, data)",
  "Workflow.upsert(data)": "→ upsert('workflow', data, { onConflict: 'id' })",
  "Workflow.delete(id)": "→ remove('workflow', id)",
  "Course.list()": "→ list('course')",
  "Course.create(data)": "→ create('course', data)",
  "Course.update(id,data)": "→ update('course', id, data)",
  "Course.delete(id)": "→ remove('course', id)",
};
