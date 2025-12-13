import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, UserPlus, Search, Users, Award, 
  CheckCircle2, Clock, Calendar
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';

export default function HRTraining() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const isAdmin = userData.role === 'admin';
      const employeeFilter = isAdmin ? {} : { assigned_hr: userData.email };

      const [coursesData, empData, assignmentsData] = await Promise.all([
        base44.entities.Course.filter({ is_active: true }),
        base44.entities.Employee.filter(employeeFilter),
        base44.entities.CourseAssignment.list()
      ]);

      setCourses(coursesData);
      setEmployees(empData);
      
      const employeeIds = empData.map(e => e.id);
      setAssignments(isAdmin ? assignmentsData : assignmentsData.filter(a => employeeIds.includes(a.employee_id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourse || selectedEmployees.length === 0) return;

    setSubmitting(true);
    try {
      const assignmentPromises = selectedEmployees.map(empId => 
        base44.entities.CourseAssignment.create({
          employee_id: empId,
          course_id: selectedCourse.id,
          course_title: selectedCourse.title,
          assigned_by: user.email,
          assigned_date: new Date().toISOString(),
          due_date: dueDate || addDays(new Date(), 30).toISOString().split('T')[0],
          status: 'not_started',
          progress_percentage: 0
        })
      );

      await Promise.all(assignmentPromises);
      await loadData();
      setAssignOpen(false);
      setSelectedCourse(null);
      setSelectedEmployees([]);
      setDueDate('');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getCourseStats = (courseId) => {
    const courseAssignments = assignments.filter(a => a.course_id === courseId);
    const completed = courseAssignments.filter(a => a.status === 'completed').length;
    const inProgress = courseAssignments.filter(a => a.status === 'in_progress').length;
    const notStarted = courseAssignments.filter(a => a.status === 'not_started').length;
    
    return { total: courseAssignments.length, completed, inProgress, notStarted };
  };

  const getEmployee = (empId) => employees.find(e => e.id === empId);

  const filteredAssignments = assignments.filter(a => {
    if (!searchQuery) return true;
    const emp = getEmployee(a.employee_id);
    const course = courses.find(c => c.id === a.course_id);
    return emp?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress').length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Training Management"
        description="Enroll and track employee training courses"
        action={() => {
          setSelectedCourse(null);
          setAssignOpen(true);
        }}
        actionLabel="Enroll Employees"
        actionIcon={UserPlus}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Courses</p>
                <p className="text-2xl font-bold text-slate-800">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Assignments</p>
                <p className="text-2xl font-bold text-slate-800">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">In Progress</p>
                <p className="text-2xl font-bold text-slate-800">{inProgressAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-800">{completedAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="overview">Course Overview</TabsTrigger>
          <TabsTrigger value="assignments">Employee Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses available"
              description="Courses will appear here once created by admins."
            />
          ) : (
            <div className="space-y-4">
              {courses.map((course, index) => {
                const stats = getCourseStats(course.id);
                const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">{course.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">{course.description}</p>
                              <div className="flex items-center gap-4 mt-3">
                                <Badge variant="secondary" className="capitalize">
                                  {course.category?.replace('_', ' ')}
                                </Badge>
                                {course.certificate_enabled && (
                                  <Badge className="bg-amber-100 text-amber-700 gap-1">
                                    <Award className="h-3 w-3" /> Certificate
                                  </Badge>
                                )}
                                <span className="text-sm text-slate-500">
                                  {course.modules?.length || 0} modules
                                </span>
                              </div>
                              
                              {stats.total > 0 && (
                                <div className="mt-4 grid grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500">Total</p>
                                    <p className="text-lg font-semibold text-slate-800">{stats.total}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Not Started</p>
                                    <p className="text-lg font-semibold text-slate-600">{stats.notStarted}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">In Progress</p>
                                    <p className="text-lg font-semibold text-blue-600">{stats.inProgress}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Completed</p>
                                    <p className="text-lg font-semibold text-emerald-600">{stats.completed}</p>
                                  </div>
                                </div>
                              )}
                              
                              {stats.total > 0 && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-slate-500">Completion Rate</span>
                                    <span className="font-medium">{completionRate}%</span>
                                  </div>
                                  <Progress value={completionRate} className="h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedCourse(course);
                              setAssignOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <UserPlus className="h-4 w-4 mr-2" /> Enroll
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by employee or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {filteredAssignments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No enrollments"
              description="Enroll employees in courses to see them here."
            />
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment, index) => {
                const emp = getEmployee(assignment.employee_id);
                const course = courses.find(c => c.id === assignment.course_id);
                
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-emerald-700 font-medium">
                                {emp?.full_name?.charAt(0) || 'E'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-slate-800">{emp?.full_name || 'Unknown'}</h3>
                                  <p className="text-sm text-slate-500">{course?.title || assignment.course_title}</p>
                                </div>
                                <StatusBadge status={assignment.status} />
                              </div>
                              
                              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                               <div className="flex items-center gap-1">
                                 <Calendar className="h-3.5 w-3.5" />
                                 Enrolled {format(parseISO(assignment.assigned_date || assignment.created_date), 'MMM d')}
                               </div>
                                {assignment.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Due {format(parseISO(assignment.due_date), 'MMM d')}
                                  </div>
                                )}
                              </div>

                              {assignment.status !== 'not_started' && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-slate-500">Progress</span>
                                    <span className="font-medium">{assignment.progress_percentage || 0}%</span>
                                  </div>
                                  <Progress value={assignment.progress_percentage || 0} className="h-2" />
                                </div>
                              )}
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
        </TabsContent>
      </Tabs>

      {/* Assign Course Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enroll Employees in Course</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedCourse && (
              <div className="space-y-2">
                <Label>Select Course *</Label>
                <Select
                  value={selectedCourse?.id || ''}
                  onValueChange={(value) => {
                    const course = courses.find(c => String(c.id) === value);
                    setSelectedCourse(course);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
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

            {selectedCourse && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">{selectedCourse.title}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedCourse.modules?.length || 0} modules • {selectedCourse.duration_minutes || 0} min
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Select Employees *</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, emp.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{emp.full_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignCourse}
              disabled={!selectedCourse || selectedEmployees.length === 0 || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Enrolling...' : `Enroll ${selectedEmployees.length} employee(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}