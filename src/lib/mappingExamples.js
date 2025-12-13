// src/lib/mappingExamples.js
// Quick generic mapping examples to replace Base44 entity usage with supabase helpers
export const examples = {
  "Workflow.list()": "→ list('workflows', { /* optional opts */ })",
  "Workflow.get(id)": "→ get('workflows', id)",
  "Workflow.create(data)": "→ create('workflows', data)",
  "Workflow.update(id, data)": "→ update('workflows', id, data)",
  "Workflow.upsert(data)": "→ upsert('workflows', data, { onConflict: 'id' })",
  "Workflow.delete(id)": "→ remove('workflows', id)",
  "Course.list()": "→ list('courses')",
  "Course.create(data)": "→ create('courses', data)",
  "Course.update(id,data)": "→ update('courses', id, data)",
  "Course.delete(id)": "→ remove('courses', id)",
};
