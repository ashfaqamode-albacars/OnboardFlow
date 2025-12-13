import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, Play, FileText, HelpCircle, Award,
  Clock, CheckCircle2, Calendar, Download
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const moduleIcons = {
  video: Play,
  reading: FileText,
  quiz: HelpCircle
};

export default function EmployeeTraining() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [activeTab, setActiveTab] = useState('enrolled');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const employees = await base44.entities.Employee.filter({ user_email: user.email });
      
      if (employees.length > 0) {
        const emp = employees[0];
        setEmployee(emp);
        
        const [assignmentsData, coursesData] = await Promise.all([
          base44.entities.CourseAssignment.filter({ employee_id: emp.id }),
          base44.entities.Course.filter({ is_active: true })
        ]);
        
        setAssignments(assignmentsData);
        setCourses(coursesData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course) => {
    if (!employee) return;
    setEnrolling(course.id);
    try {
      await base44.entities.CourseAssignment.create({
        employee_id: employee.id,
        course_id: course.id,
        course_title: course.title,
        assigned_by: employee.user_email,
        assigned_date: new Date().toISOString(),
        status: 'not_started',
        progress_percentage: 0
      });
      await loadData();
      setActiveTab('enrolled');
    } catch (e) {
      console.error(e);
    } finally {
      setEnrolling(null);
    }
  };

  const getCourse = (courseId) => courses.find(c => c.id === courseId);

  const filterAssignments = (status) => {
    if (status === 'completed') return assignments.filter(a => a.status === 'completed');
    return assignments.filter(a => a.status !== 'completed');
  };

  const availableCourses = courses.filter(c => 
    c.available_to_all && !assignments.some(a => a.course_id === c.id)
  );

  const enrolledAssignments = filterAssignments('in_progress');

  const startCourse = (assignment) => {
    navigate(createPageUrl('CourseViewer') + `?assignmentId=${assignment.id}`);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const completedCount = filterAssignments('completed').length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="My Training"
        description="View, enroll, and complete your training courses"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="enrolled">
            My Courses
            {enrolledAssignments.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {enrolledAssignments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="available">
            Available Courses
            {availableCourses.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                {availableCourses.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          {enrolledAssignments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No enrolled courses"
              description="Browse available courses to get started with your training."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledAssignments.map((assignment, index) => {
                const course = getCourse(assignment.course_id);
                if (!course) return null;
                
                const isOverdue = assignment.due_date && isAfter(new Date(), parseISO(assignment.due_date)) && assignment.status !== 'completed';
                
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "border-0 shadow-sm hover:shadow-md transition-all cursor-pointer",
                      isOverdue && "border-l-4 border-l-red-500"
                    )}
                      onClick={() => startCourse(assignment)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-slate-800 mb-2">{course.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{course.description}</p>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-4 flex-wrap">
                          {course.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {course.duration_minutes} min
                            </div>
                          )}
                          {course.modules?.length > 0 && (
                            <span>{course.modules.length} modules</span>
                          )}
                          {course.certificate_enabled && (
                            <Badge className="bg-amber-100 text-amber-700 gap-1">
                              <Award className="h-3 w-3" /> Cert
                            </Badge>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-medium">{assignment.progress_percentage || 0}%</span>
                          </div>
                          <Progress value={assignment.progress_percentage || 0} className="h-2" />
                        </div>

                        {assignment.due_date && (
                          <div className={cn(
                            "flex items-center gap-1.5 text-sm mb-4",
                            isOverdue ? "text-red-600" : "text-slate-500"
                          )}>
                            <Calendar className="h-3.5 w-3.5" />
                            Due {format(parseISO(assignment.due_date), 'MMM d, yyyy')}
                          </div>
                        )}

                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          {assignment.status === 'not_started' ? 'Start Course' : 'Continue'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available">
          {availableCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No available courses"
              description="All available courses have been enrolled. Check back later for new courses."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course, index) => {
                const Icon = moduleIcons[course.modules?.[0]?.type] || BookOpen;
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{course.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          <Badge variant="secondary" className="capitalize">
                            {course.category?.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {course.modules?.length || 0} modules
                          </Badge>
                          {course.certificate_enabled && (
                            <Badge className="bg-amber-100 text-amber-700 gap-1">
                              <Award className="h-3 w-3" /> Certificate
                            </Badge>
                          )}
                        </div>

                        <Button 
                          onClick={() => handleEnroll(course)}
                          disabled={enrolling === course.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {filterAssignments('completed').length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No completed courses"
              description="Complete some courses to see them here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterAssignments('completed').map((assignment, index) => {
                const course = getCourse(assignment.course_id);
                if (!course) return null;
                
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => startCourse(assignment)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          </div>
                          {course.certificate_enabled && assignment.certificate_url && (
                            <Badge className="bg-amber-100 text-amber-700 gap-1">
                              <Award className="h-3 w-3" /> Certificate
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-slate-800 mb-2">{course.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{course.description}</p>
                        
                        {assignment.completed_date && (
                          <p className="text-sm text-slate-500 mb-4">
                            Completed {format(parseISO(assignment.completed_date), 'MMM d, yyyy')}
                          </p>
                        )}

                        <div className="flex gap-2">
                          {assignment.certificate_url && (
                            <Button 
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(assignment.certificate_url, '_blank');
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" /> Certificate
                            </Button>
                          )}
                          <Button className={cn(
                            assignment.certificate_url ? "flex-1" : "w-full",
                            "bg-slate-600 hover:bg-slate-700"
                          )}>
                            Review Course
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
      </Tabs>
    </div>
  );
}