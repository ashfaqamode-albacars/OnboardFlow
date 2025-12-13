import React, { useState, useEffect } from 'react';
import { list, create, update, remove } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, Plus, Edit, Trash2, GripVertical, 
  FileText, Package, FormInput, BookOpen, CheckSquare
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const taskTypeOptions = [
  { value: 'form', label: 'Complete Form', icon: FormInput },
  { value: 'document_upload', label: 'Upload Document', icon: FileText },
  { value: 'equipment_request', label: 'Equipment Request', icon: Package },
  { value: 'training', label: 'Complete Training', icon: BookOpen },
  { value: 'review', label: 'Review Material', icon: BookOpen },
  { value: 'acknowledgement', label: 'Acknowledgement', icon: CheckSquare },
  { value: 'custom', label: 'Custom Task', icon: CheckSquare }
];

export default function AdminWorkflows() {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
    tasks: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workflowsRes, formsRes, docTypesRes, coursesRes] = await Promise.all([
        list('workflows'),
        list('form_templates', { select: '*' }),
        list('document_types', { select: '*' }),
        list('courses', { select: '*' })
      ]);
      setWorkflows(workflowsRes.data ?? []);
      setFormTemplates(formsRes.data ?? []);
      setDocumentTypes(docTypesRes.data ?? []);
      setCourses(coursesRes.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      is_active: workflow.is_active !== false,
      is_default: workflow.is_default || false,
      tasks: (workflow.tasks || []).map(task => ({
        ...task,
        form_id: task.form_id ? String(task.form_id) : '',
        document_type_id: task.document_type_id ? String(task.document_type_id) : '',
        course_id: task.course_id ? String(task.course_id) : '',
        description: task.description || '',
        due_days: task.due_days || 7
      }))
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
      is_default: false,
      tasks: []
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        tasks: formData.tasks.map((task, index) => ({
          ...task,
          order: index,
          form_id: task.form_id || null,
          document_type_id: task.document_type_id || null,
          course_id: task.course_id || null
        }))
      };

      if (selectedWorkflow) {
        await update('workflows', selectedWorkflow.id, data);
      } else {
        await create('workflows', data);
      }

      await loadData();
      setEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (workflow) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await remove('workflows', workflow.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const addTask = () => {
    const newTask = {
      id: `task_${Date.now()}`,
      title: '',
      description: '',
      type: 'custom',
      due_days: 7,
      is_required: true,
      form_id: '',
      document_type_id: '',
      course_id: ''
    };
    setFormData({
      ...formData,
      tasks: [...formData.tasks, newTask]
    });
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...formData.tasks];
    
    // If changing type, clear type-specific fields
    if (field === 'type') {
      newTasks[index] = {
        ...newTasks[index],
        [field]: value,
        form_id: '',
        document_type_id: '',
        course_id: ''
      };
    } else {
      newTasks[index] = { ...newTasks[index], [field]: value };
    }
    
    setFormData({ ...formData, tasks: newTasks });
  };

  const removeTask = (index) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData({ ...formData, tasks: items });
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Workflow Builder"
        description="Create and manage onboarding workflows"
        action={handleCreate}
        actionLabel="Create Workflow"
        actionIcon={Plus}
      />

      {workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No workflows yet"
          description="Create your first onboarding workflow to automate employee onboarding."
          action={handleCreate}
          actionLabel="Create Workflow"
        />
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Workflow className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{workflow.name}</h3>
                          {workflow.is_default && (
                            <Badge className="bg-emerald-100 text-emerald-700">Default</Badge>
                          )}
                          {!workflow.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-slate-500 mt-1">{workflow.description || 'No description'}</p>
                        <p className="text-sm text-slate-400 mt-2">
                          {workflow.tasks?.length || 0} tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(workflow)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(workflow)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Task Preview */}
                  {workflow.tasks?.length > 0 && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                      {workflow.tasks.slice(0, 5).map((task, i) => {
                        const typeConfig = taskTypeOptions.find(t => t.value === task.type);
                        const Icon = typeConfig?.icon || CheckSquare;
                        return (
                          <Badge key={i} variant="secondary" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {task.title}
                          </Badge>
                        );
                      })}
                      {workflow.tasks.length > 5 && (
                        <Badge variant="secondary">+{workflow.tasks.length - 5} more</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </DialogTitle>
            <DialogDescription>
              Configure workflow details, tasks, and training assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Workflow Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="New Employee Onboarding"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Standard onboarding workflow for new employees..."
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
                <Label>Default Workflow</Label>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg">Workflow Tasks</Label>
                <Button onClick={addTask} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Task
                </Button>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tasks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {formData.tasks.map((task, index) => {
                        const typeConfig = taskTypeOptions.find(t => t.value === task.type);
                        const Icon = typeConfig?.icon || CheckSquare;
                        
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "p-4 bg-slate-50 rounded-xl border-2 border-transparent",
                                  snapshot.isDragging && "border-emerald-500 shadow-lg"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                    <GripVertical className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Task title"
                                        value={task.title}
                                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                                      />
                                      <Select
                                        value={task.type}
                                        onValueChange={(value) => updateTask(index, 'type', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {taskTypeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              <div className="flex items-center gap-2">
                                                <option.icon className="h-4 w-4" />
                                                {option.label}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Input
                                      placeholder="Task description"
                                      value={task.description || ''}
                                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Due (days)</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={task.due_days || ''}
                                          onChange={(e) => updateTask(index, 'due_days', parseInt(e.target.value))}
                                        />
                                      </div>
                                      {task.type === 'form' && (
                                        <div className="col-span-2 space-y-1">
                                          <Label className="text-xs">Form Template</Label>
                                          <Select
                                            value={task.form_id || ''}
                                            onValueChange={(value) => updateTask(index, 'form_id', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select form" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {formTemplates.map((form) => (
                                                <SelectItem key={form.id} value={String(form.id)}>
                                                  {form.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                      {task.type === 'document_upload' && (
                                        <div className="col-span-2 space-y-1">
                                          <Label className="text-xs">Document Type</Label>
                                          <Select
                                            value={task.document_type_id || ''}
                                            onValueChange={(value) => updateTask(index, 'document_type_id', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select document type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {documentTypes.map((docType) => (
                                                  <SelectItem key={docType.id} value={String(docType.id)}>
                                                    {docType.name}
                                                  </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                      {task.type === 'training' && (
                                        <div className="col-span-2 space-y-1">
                                          <Label className="text-xs">Training Course</Label>
                                          <Select
                                            value={task.course_id || ''}
                                            onValueChange={(value) => updateTask(index, 'course_id', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {courses.map((course) => (
                                                  <SelectItem key={course.id} value={String(course.id)}>
                                                    {course.title}
                                                  </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTask(index)}
                                    className="text-red-500 hover:text-red-600"
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

              {formData.tasks.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-500">
                  No tasks added yet. Click "Add Task" to get started.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : 'Save Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}