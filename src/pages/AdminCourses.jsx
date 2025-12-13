import React, { useState, useEffect } from 'react';
import { list, create, update, remove, storageUpload } from '@/api/supabaseClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Plus, Edit, Trash2, GripVertical, Play,
  FileText, HelpCircle, Upload, X
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const moduleTypes = [
  { value: 'video', label: 'Video', icon: Play },
  { value: 'reading', label: 'Reading Material', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle }
];

const categories = ['compliance', 'technical', 'soft_skills', 'onboarding', 'safety', 'other'];

export default function AdminCourses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [documentTemplates, setDocumentTemplates] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    duration_minutes: 0,
    is_active: true,
    available_to_all: false,
    certificate_enabled: false,
    certificate_template_id: '',
    certificate_file_url: '',
    modules: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, templatesRes] = await Promise.all([
        list('courses', { select: '*' }),
        list('document_templates', { select: '*' })
      ]);
      setCourses(coursesRes.data ?? []);
      setDocumentTemplates(templatesRes.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      category: course.category || 'other',
      duration_minutes: course.duration_minutes || 0,
      is_active: course.is_active !== false,
      available_to_all: course.available_to_all || false,
      certificate_enabled: course.certificate_enabled || false,
      certificate_template_id: course.certificate_template_id || '',
      certificate_file_url: course.certificate_file_url || '',
      modules: course.modules || []
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    setSelectedCourse(null);
    setFormData({
      title: '',
      description: '',
      category: 'other',
      duration_minutes: 0,
      is_active: true,
      available_to_all: false,
      certificate_enabled: false,
      certificate_template_id: '',
      certificate_file_url: '',
      modules: []
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return;
    
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        modules: formData.modules.map((mod, index) => ({
          ...mod,
          order: index
        }))
      };

      if (selectedCourse) {
        await update('courses', selectedCourse.id, data);
      } else {
        await create('courses', data);
      }

      await loadData();
      setEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await remove('courses', course.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const addModule = (type) => {
    const newModule = {
      id: `module_${Date.now()}`,
      title: '',
      type,
      order: formData.modules.length,
      ...(type === 'video' && { video_url: '' }),
      ...(type === 'reading' && { reading_url: '', reading_content: '' }),
      ...(type === 'quiz' && { 
        quiz: { 
          passing_score: 70, 
          questions: [] 
        } 
      })
    };
    setFormData({ ...formData, modules: [...formData.modules, newModule] });
  };

  const updateModule = (index, field, value) => {
    const newModules = [...formData.modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setFormData({ ...formData, modules: newModules });
  };

  const removeModule = (index) => {
    setFormData({ ...formData, modules: formData.modules.filter((_, i) => i !== index) });
  };

  const addQuestion = (moduleIndex) => {
    const newModules = [...formData.modules];
    const quiz = newModules[moduleIndex].quiz;
    quiz.questions.push({
      question: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    });
    setFormData({ ...formData, modules: newModules });
  };

  const updateQuestion = (moduleIndex, questionIndex, field, value) => {
    const newModules = [...formData.modules];
    newModules[moduleIndex].quiz.questions[questionIndex][field] = value;
    setFormData({ ...formData, modules: newModules });
  };

  const removeQuestion = (moduleIndex, questionIndex) => {
    const newModules = [...formData.modules];
    newModules[moduleIndex].quiz.questions.splice(questionIndex, 1);
    setFormData({ ...formData, modules: newModules });
  };

  const handleFileUpload = async (e, moduleIndex, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadKey = `${moduleIndex}-${type}`;
    setUploadProgress({ ...uploadProgress, [uploadKey]: 'uploading' });
    setUploading(true);
    
    try {
      // Upload to Supabase storage (bucket must be created in your project).
      // Change 'course-media' to your bucket name.
      const uploadPath = `courses/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await storageUpload('course-media', uploadPath, file);
      if (uploadError) throw uploadError;
      // Construct public URL (if you use public bucket) or use signed URL separately.
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '')}/storage/v1/object/public/course-media/${uploadPath}`;
      setUploadProgress({ ...uploadProgress, [uploadKey]: 'complete' });
      updateModule(moduleIndex, type === 'video' ? 'video_url' : 'reading_url', publicUrl);
      
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadKey];
          return newProgress;
        });
      }, 3000);
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please try again.');
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadKey];
        return newProgress;
      });
    } finally {
      setUploading(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData({ ...formData, modules: items });
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Course Builder"
        description="Create and manage training courses"
        action={handleCreate}
        actionLabel="Create Course"
        actionIcon={Plus}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first training course with videos, reading materials, and quizzes."
          action={handleCreate}
          actionLabel="Create Course"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(course)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800 mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center flex-wrap gap-2 mt-4">
                    <Badge variant="secondary" className="capitalize">
                      {course.category?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {course.modules?.length || 0} modules
                    </Badge>
                    {course.certificate_enabled && (
                      <Badge className="bg-amber-100 text-amber-700">Certificate</Badge>
                    )}
                    {!course.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Course Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="IT Security Awareness Training"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive security training..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Issue Certificate</Label>
                <Switch
                  checked={formData.certificate_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, certificate_enabled: checked })}
                />
              </div>
            </div>

            {/* Certificate Settings */}
            {formData.certificate_enabled && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="col-span-2">
                  <Label className="text-amber-800">Certificate Template</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Use Document Template</Label>
                  <Select
                    value={formData.certificate_template_id}
                    onValueChange={(value) => setFormData({ ...formData, certificate_template_id: value, certificate_file_url: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {documentTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Or Upload Static Certificate</Label>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('cert-upload').click()}
                      disabled={uploading || !!formData.certificate_template_id}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formData.certificate_file_url ? 'Change File' : 'Upload PDF'}
                    </Button>
                    <input
                      id="cert-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const uploadPath = `certificates/${Date.now()}-${file.name}`;
                          const { data: uploadData, error: uploadError } = await storageUpload('course-media', uploadPath, file);
                          if (uploadError) throw uploadError;
                          const publicUrl = `${import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '')}/storage/v1/object/public/course-media/${uploadPath}`;
                          setFormData({ ...formData, certificate_file_url: publicUrl, certificate_template_id: '' });
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                    {formData.certificate_file_url && (
                      <p className="text-xs text-emerald-600 mt-1">✓ Certificate uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg">Course Modules</Label>
                <div className="flex gap-2">
                  {moduleTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        onClick={() => addModule(type.value)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4" /> {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="modules">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {formData.modules.map((module, moduleIndex) => {
                        const TypeIcon = moduleTypes.find(t => t.value === module.type)?.icon || FileText;
                        
                        return (
                          <Draggable key={module.id} draggableId={module.id} index={moduleIndex}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "p-4 bg-slate-50 rounded-xl border-2 border-transparent",
                                  snapshot.isDragging && "border-blue-500 shadow-lg"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                    <GripVertical className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <TypeIcon className="h-5 w-5 text-slate-600" />
                                      <Input
                                        placeholder="Module title"
                                        value={module.title}
                                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                                        className="flex-1"
                                      />
                                    </div>

                                    {/* Video Module */}
                                    {module.type === 'video' && (
                                      <div className="space-y-2">
                                        <Label className="text-xs">Video URL or Upload</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="https://..."
                                            value={module.video_url || ''}
                                            onChange={(e) => updateModule(moduleIndex, 'video_url', e.target.value)}
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById(`video-${moduleIndex}`).click()}
                                            disabled={uploading}
                                          >
                                            <Upload className="h-4 w-4" />
                                          </Button>
                                          <input
                                            id={`video-${moduleIndex}`}
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, moduleIndex, 'video')}
                                          />
                                        </div>
                                        {uploadProgress[`${moduleIndex}-video`] && (
                                          <div className="flex items-center gap-2 text-sm">
                                            {uploadProgress[`${moduleIndex}-video`] === 'complete' ? (
                                              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                                <CheckCircle2 className="h-4 w-4" /> Upload complete!
                                              </span>
                                            ) : (
                                              <span className="text-blue-600 flex items-center gap-2">
                                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                                Uploading video...
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Reading Module */}
                                    {module.type === 'reading' && (
                                      <div className="space-y-2">
                                        <Label className="text-xs">PDF URL or Content</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="https://... (PDF URL)"
                                            value={module.reading_url || ''}
                                            onChange={(e) => updateModule(moduleIndex, 'reading_url', e.target.value)}
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById(`pdf-${moduleIndex}`).click()}
                                            disabled={uploading}
                                          >
                                            <Upload className="h-4 w-4" />
                                          </Button>
                                          <input
                                            id={`pdf-${moduleIndex}`}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, moduleIndex, 'reading')}
                                          />
                                        </div>
                                        {uploadProgress[`${moduleIndex}-reading`] && (
                                          <div className="flex items-center gap-2 text-sm">
                                            {uploadProgress[`${moduleIndex}-reading`] === 'complete' ? (
                                              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                                <CheckCircle2 className="h-4 w-4" /> Upload complete!
                                              </span>
                                            ) : (
                                              <span className="text-blue-600 flex items-center gap-2">
                                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                                                Uploading PDF...
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <Textarea
                                          placeholder="Or paste HTML content here..."
                                          value={module.reading_content || ''}
                                          onChange={(e) => updateModule(moduleIndex, 'reading_content', e.target.value)}
                                          rows={3}
                                        />
                                      </div>
                                    )}

                                    {/* Quiz Module */}
                                    {module.type === 'quiz' && (
                                      <div className="space-y-3 border-t pt-3">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs">Passing Score (%)</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={module.quiz.passing_score}
                                            onChange={(e) => {
                                              const newModules = [...formData.modules];
                                              newModules[moduleIndex].quiz.passing_score = parseInt(e.target.value) || 0;
                                              setFormData({ ...formData, modules: newModules });
                                            }}
                                            className="w-20"
                                          />
                                        </div>

                                        {module.quiz.questions.map((question, qIndex) => (
                                          <div key={qIndex} className="p-3 bg-white rounded-lg space-y-2">
                                            <div className="flex items-start gap-2">
                                              <Input
                                                placeholder={`Question ${qIndex + 1}`}
                                                value={question.question}
                                                onChange={(e) => updateQuestion(moduleIndex, qIndex, 'question', e.target.value)}
                                              />
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeQuestion(moduleIndex, qIndex)}
                                              >
                                                <X className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </div>
                                            {question.options.map((option, oIndex) => (
                                              <div key={oIndex} className="flex items-center gap-2">
                                                <input
                                                  type="radio"
                                                  checked={question.correct_answer === oIndex}
                                                  onChange={() => updateQuestion(moduleIndex, qIndex, 'correct_answer', oIndex)}
                                                  className="flex-shrink-0"
                                                />
                                                <Input
                                                  placeholder={`Option ${oIndex + 1}`}
                                                  value={option}
                                                  onChange={(e) => {
                                                    const newOptions = [...question.options];
                                                    newOptions[oIndex] = e.target.value;
                                                    updateQuestion(moduleIndex, qIndex, 'options', newOptions);
                                                  }}
                                                  className="text-sm"
                                                />
                                              </div>
                                            ))}
                                            <Input
                                              placeholder="Explanation (optional)"
                                              value={question.explanation || ''}
                                              onChange={(e) => updateQuestion(moduleIndex, qIndex, 'explanation', e.target.value)}
                                              className="text-sm"
                                            />
                                          </div>
                                        ))}

                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => addQuestion(moduleIndex)}
                                          className="w-full"
                                        >
                                          <Plus className="h-4 w-4 mr-1" /> Add Question
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeModule(moduleIndex)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {formData.modules.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-500">
                  No modules added. Click a module type button above to start building your course.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : 'Save Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}