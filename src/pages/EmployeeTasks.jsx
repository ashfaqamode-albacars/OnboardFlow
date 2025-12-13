import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckSquare, Clock, Calendar, FileText, Package, 
  FormInput, BookOpen, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

const taskTypeIcons = {
  form: FormInput,
  document_upload: FileText,
  equipment_request: Package,
  training: BookOpen,
  review: BookOpen,
  acknowledgement: CheckSquare,
  custom: CheckSquare,
  approval: CheckCircle2
};

export default function EmployeeTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formTemplate, setFormTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-open task if taskId is in URL
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        openTask(task);
      }
    }
  }, [tasks]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const employees = await base44.entities.Employee.filter({ user_email: user.email });
      
      if (employees.length > 0) {
        const emp = employees[0];
        setEmployee(emp);
        const tasksData = await base44.entities.Task.filter({ 
          employee_id: emp.id, 
          assigned_role: 'employee' 
        });
        setTasks(tasksData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openTask = async (task) => {
    setSelectedTask(task);
    setFormTemplate(null);
    setFormData({});
    setUploadFile(null);
    
    if (task.type === 'form' && task.form_id) {
      setLoadingForm(true);
      try {
        const forms = await base44.entities.FormTemplate.list();
        const matchingForm = forms.find(f => f.id === task.form_id);
        if (matchingForm) {
          setFormTemplate(matchingForm);
          setFormData(task.form_data || {});
        } else {
          console.error('Form not found. Task form_id:', task.form_id, 'Available forms:', forms.map(f => ({id: f.id, name: f.name})));
        }
      } catch (e) {
        console.error('Error loading form:', e);
      } finally {
        setLoadingForm(false);
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await base44.entities.Task.update(selectedTask.id, {
        status: 'completed',
        completed_date: new Date().toISOString(),
        form_data: formData
      });
      
      // Update employee personal info if it's a personal info form
      if (formTemplate?.form_type === 'personal_info') {
        await base44.entities.Employee.update(employee.id, {
          personal_info: { ...employee.personal_info, ...formData }
        });
      }

      await loadData();
      setSelectedTask(null);
      setFormTemplate(null);
      setFormData({});
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await base44.entities.Task.update(selectedTask.id, {
        status: 'completed',
        completed_date: new Date().toISOString()
      });
      await loadData();
      setSelectedTask(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile || !selectedTask || !employee) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      
      const docTypes = await base44.entities.DocumentType.filter({ id: selectedTask.document_type_id });
      const docTypeName = docTypes.length > 0 ? docTypes[0].name : 'Document';
      
      const doc = await base44.entities.Document.create({
        employee_id: employee.id,
        document_type_id: selectedTask.document_type_id,
        document_type_name: docTypeName,
        file_url,
        status: 'pending',
        submitted_date: new Date().toISOString()
      });

      await base44.entities.Task.update(selectedTask.id, {
        status: 'completed',
        completed_date: new Date().toISOString(),
        related_id: doc.id
      });

      await loadData();
      setSelectedTask(null);
      setUploadFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const filterTasks = (status) => {
    if (status === 'all') return tasks;
    if (status === 'pending') return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    if (status === 'overdue') return tasks.filter(t => 
      t.status !== 'completed' && t.due_date && isAfter(new Date(), parseISO(t.due_date))
    );
    return tasks.filter(t => t.status === status);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pendingCount = filterTasks('pending').length;
  const completedCount = filterTasks('completed').length;
  const overdueCount = filterTasks('overdue').length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="My Tasks"
        description="Complete your onboarding tasks to get started"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Overdue
            {overdueCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                {overdueCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {['pending', 'completed', 'overdue'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <AnimatePresence mode="wait">
              {filterTasks(tab).length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title={tab === 'completed' ? "No completed tasks yet" : "No tasks here"}
                  description={tab === 'pending' ? "All caught up! No pending tasks." : 
                    tab === 'overdue' ? "Great! No overdue tasks." : "Complete some tasks to see them here."}
                />
              ) : (
                <div className="space-y-4">
                  {filterTasks(tab).map((task, index) => {
                    const Icon = taskTypeIcons[task.type] || CheckSquare;
                    const isOverdue = task.due_date && isAfter(new Date(), parseISO(task.due_date)) && task.status !== 'completed';
                    
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card 
                          className={cn(
                            "border-0 shadow-sm hover:shadow-md transition-all cursor-pointer",
                            isOverdue && "border-l-4 border-l-red-500"
                          )}
                          onClick={() => openTask(task)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                task.status === 'completed' ? "bg-emerald-100" :
                                isOverdue ? "bg-red-100" : "bg-blue-100"
                              )}>
                                <Icon className={cn(
                                  "h-6 w-6",
                                  task.status === 'completed' ? "text-emerald-600" :
                                  isOverdue ? "text-red-600" : "text-blue-600"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                  </div>
                                  <StatusBadge status={isOverdue && task.status !== 'completed' ? 'overdue' : task.status} />
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                  {task.due_date && (
                                    <div className={cn(
                                      "flex items-center gap-1.5 text-sm",
                                      isOverdue ? "text-red-600" : "text-slate-500"
                                    )}>
                                      <Calendar className="h-3.5 w-3.5" />
                                      Due {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                    </div>
                                  )}
                                  <span className="text-sm text-slate-400 capitalize">
                                    {task.type.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>

      {/* Task Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => {
        setSelectedTask(null);
        setFormTemplate(null);
        setFormData({});
        setUploadFile(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-slate-600 mb-6">{selectedTask?.description}</p>

            {/* Form Type Task */}
            {selectedTask?.type === 'form' && (
              loadingForm ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : formTemplate ? (
              <div className="space-y-6">
                {formTemplate.fields?.sort((a, b) => (a.order || 0) - (b.order || 0)).map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-slate-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'text' && (
                      <Input
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                    {field.type === 'email' && (
                      <Input
                        type="email"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                    {field.type === 'phone' && (
                      <Input
                        type="tel"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                    {field.type === 'select' && (
                      <select
                        className="w-full border rounded-lg px-3 py-2 text-slate-700"
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={formData[field.id] || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: checked })}
                        />
                        <span className="text-sm text-slate-600">{field.placeholder}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              ) : (
                <div className="bg-red-50 rounded-xl p-6">
                  <p className="text-red-800 mb-2">Form template not found. Please contact your HR administrator.</p>
                  <details className="mt-4 text-sm text-slate-600">
                    <summary className="cursor-pointer">Debug Info</summary>
                    <div className="mt-2 p-2 bg-white rounded text-left font-mono text-xs">
                      <div>Task form_id: {selectedTask?.form_id || 'null'}</div>
                      <div className="mt-1">Open browser console for more details</div>
                    </div>
                  </details>
                </div>
              )
            )}

            {/* Acknowledgement Type Task */}
            {selectedTask?.type === 'acknowledgement' && (
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-slate-600">
                  Please review and acknowledge that you have completed this task.
                </p>
              </div>
            )}

            {/* Review Type Task */}
            {selectedTask?.type === 'review' && (
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-slate-600">
                  Please review the required materials and confirm completion.
                </p>
              </div>
            )}

            {/* Document Upload */}
            {selectedTask?.type === 'document_upload' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('doc-file-input').click()}
                  >
                    <input
                      id="doc-file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-emerald-600" />
                        <span className="font-medium text-slate-700">{uploadFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-slate-400 mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Equipment Request - Redirect */}
            {selectedTask?.type === 'equipment_request' && (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <p className="text-blue-800 mb-4">
                  Add items to your cart and submit a single equipment request.
                </p>
                <Button 
                  onClick={() => {
                    setSelectedTask(null);
                    window.location.href = `/EmployeeEquipment?taskId=${selectedTask.id}`;
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Equipment Catalog
                </Button>
              </div>
            )}

            {/* Training - Redirect */}
            {selectedTask?.type === 'training' && (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <p className="text-blue-800 mb-4">
                  Complete the required training course to mark this task as done.
                </p>
                <Button 
                  onClick={() => {
                    setSelectedTask(null);
                    window.location.href = '/EmployeeTraining';
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Training
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedTask(null);
              setUploadFile(null);
            }}>
              Cancel
            </Button>
            {selectedTask?.type === 'form' && formTemplate && !loadingForm && (
              <Button 
                onClick={handleFormSubmit} 
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            )}
            {selectedTask?.type === 'document_upload' && (
              <Button 
                onClick={handleDocumentUpload} 
                disabled={!uploadFile || uploading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            )}
            {(selectedTask?.type === 'acknowledgement' || selectedTask?.type === 'review') && (
              <Button 
                onClick={handleAcknowledge} 
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? 'Confirming...' : 'Confirm Completion'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}