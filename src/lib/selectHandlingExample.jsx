// src/lib/selectHandlingExample.jsx
import React, { useState } from 'react';

export default function CourseSelect({ courses, initialCourseId, onSave }) {
  const [courseId, setCourseId] = useState(initialCourseId || ''); // UUID string
  return (
    <div>
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
        <option value="">-- none --</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <button onClick={() => onSave({ course_id: courseId })}>Save</button>
    </div>
  );
}
