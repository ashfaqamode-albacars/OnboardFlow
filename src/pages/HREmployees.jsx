import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import * as Integrations from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, Search, Mail, Phone, Building, Calendar,
  MoreHorizontal, Eye, Edit, Trash2
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function HREmployees() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [user, setUser] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    start_date: '',
    workflow_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await Entities.User.me();
      setUser(userData);

      const isAdmin = userData.role === 'admin';
      const employeeFilter = isAdmin ? {} : { assigned_hr: userData.email };

      const [empData, workflowData, formData] = await Promise.all([
        Entities.Employee.filter(employeeFilter),
        Entities.Workflow.filter({ is_active: true }),
        Entities.FormTemplate.filter({ is_active: true })
      ]);

      setEmployees(empData);
      setWorkflows(workflowData);
      setFormTemplates(formData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!formData.full_name || !formData.email) return;
    
    setSubmitting(true);
    try {
      // Create employee
      const employee = await Entities.Employee.create({
        ...formData,
        assigned_hr: user.email,
        user_email: formData.email,
        onboarding_status: 'in_progress',
        onboarding_progress: 0
      });

      // Send invitation email
      await Integrations.SendEmail({
        to: formData.email,
        subject: 'Welcome to OnboardHub - Your Onboarding Portal',
        body: `
          <h2>Welcome to OnboardHub, ${formData.full_name}!</h2>
          <p>Your onboarding account has been created. You can now log in to access your tasks, documents, and training materials.</p>
          <p><strong>Your Login Email:</strong> ${formData.email}</p>
          <p><strong>Login URL:</strong> ${window.location.origin}</p>
          <p>If this is your first time logging in, you'll be able to set up your password.</p>
          <p>If you have any questions, please contact your HR representative at ${user.email}.</p>
          <br>
          <p>Best regards,<br>The OnboardHub Team</p>
        `
      });

      // Create tasks from workflow if selected
      if (formData.workflow_id) {
        const workflow = workflows.find(w => String(w.id) === formData.workflow_id);
        if (workflow?.tasks) {
          for (const task of workflow.tasks) {
            const dueDate = task.due_days 
              ? addDays(new Date(formData.start_date || new Date()), task.due_days)
              : null;

            // If it's a training task, create course assignment
            if (task.type === 'training' && task.course_id) {
              const courses = await Entities.Course.filter({ id: Number(task.course_id) });
              if (courses.length > 0) {
                await Entities.CourseAssignment.create({
                  employee_id: employee.id,
                  course_id: Number(task.course_id),
                  course_title: courses[0].title,
                  assigned_by: user.email,
                  assigned_date: new Date().toISOString(),
                  due_date: dueDate?.toISOString().split('T')[0],
                  status: 'not_started',
                  progress_percentage: 0
                });
              }
            }

            await Entities.Task.create({
              employee_id: employee.id,
              workflow_task_id: task.id,
              title: task.title,
              description: task.description,
              type: task.type,
              status: 'pending',
              due_date: dueDate?.toISOString().split('T')[0],
              assigned_to: formData.email,
              assigned_role: 'employee',
              form_id: task.form_id,
              document_type_id: task.document_type_id,
              related_id: task.course_id
            });
          }
        }
      }

      await loadData();
      setAddOpen(false);
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      start_date: '',
      workflow_id: ''
    });
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.onboarding_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Employees"
        description="Manage employee onboarding"
        action={() => setAddOpen(true)}
        actionLabel="Add Employee"
        actionIcon={UserPlus}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employees List */}
      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No employees found"
          description={searchQuery ? "Try a different search term." : "Add your first employee to get started."}
          action={() => setAddOpen(true)}
          actionLabel="Add Employee"
        />
      ) : (
        <div className="space-y-4">
          {filteredEmployees.map((emp, index) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-semibold">
                        {emp.full_name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{emp.full_name}</h3>
                        <p className="text-slate-500">{emp.position || 'No position'} • {emp.department || 'No department'}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {emp.email}
                          </div>
                          {emp.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {emp.phone}
                            </div>
                          )}
                          {emp.start_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(parseISO(emp.start_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={emp.onboarding_status || 'not_started'} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedEmployee(emp);
                            setViewOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedEmployee(emp);
                            setFormData({
                              full_name: emp.full_name,
                              email: emp.email,
                              phone: emp.phone || '',
                              position: emp.position || '',
                              department: emp.department || '',
                              start_date: emp.start_date || '',
                              workflow_id: emp.workflow_id || ''
                            });
                            setAddOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">Onboarding Progress</span>
                      <span className="font-medium text-slate-700">{emp.onboarding_progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${emp.onboarding_progress || 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => {
        setAddOpen(open);
        if (!open) {
          setSelectedEmployee(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering"
                />
              </div>
              {!selectedEmployee && (
                <div className="col-span-2 space-y-2">
                  <Label>Onboarding Workflow</Label>
                  <Select 
                    value={formData.workflow_id} 
                    onValueChange={(value) => setFormData({ ...formData, workflow_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workflow" />
                    </SelectTrigger>
                    <SelectContent>
                        {workflows.map((workflow) => (
                          <SelectItem key={workflow.id} value={String(workflow.id)}>
                            {workflow.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddOpen(false);
              setSelectedEmployee(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddEmployee}
              disabled={!formData.full_name || !formData.email || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : selectedEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedEmployee.full_name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{selectedEmployee.full_name}</h3>
                  <p className="text-slate-500">{selectedEmployee.position} • {selectedEmployee.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-800">{selectedEmployee.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-800">{selectedEmployee.phone || '-'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="font-medium text-slate-800">
                    {selectedEmployee.start_date ? format(parseISO(selectedEmployee.start_date), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Status</p>
                  <StatusBadge status={selectedEmployee.onboarding_status || 'not_started'} />
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Onboarding Progress</span>
                  <span className="font-medium">{selectedEmployee.onboarding_progress || 0}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${selectedEmployee.onboarding_progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}