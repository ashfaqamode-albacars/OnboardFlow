import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckSquare, FileText, Package, ArrowRight, Clock, 
  CheckCircle2, AlertCircle, Calendar
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import StatsCard from '../components/shared/StatsCard';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [equipmentRequests, setEquipmentRequests] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const employees = await base44.entities.Employee.filter({ user_email: userData.email });
      if (employees.length > 0) {
        const emp = employees[0];
        setEmployee(emp);

        const [tasksData, docsData, equipData] = await Promise.all([
          base44.entities.Task.filter({ employee_id: emp.id, assigned_role: 'employee' }),
          base44.entities.Document.filter({ employee_id: emp.id }),
          base44.entities.EquipmentRequest.filter({ employee_id: emp.id })
        ]);

        setTasks(tasksData);
        setDocuments(docsData);
        setEquipmentRequests(equipData);
      } else {
        // No employee profile - redirect to HR Dashboard (for HR/Admin users)
        navigate(createPageUrl('HRDashboard'));
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => 
    t.status !== 'completed' && t.due_date && isAfter(new Date(), parseISO(t.due_date))
  ).length;

  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return null; // Redirecting to HR Dashboard
  }

  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Welcome back</p>
                <h1 className="text-3xl font-bold mb-2">{employee.full_name}</h1>
                <p className="text-emerald-100">{employee.position} • {employee.department}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-w-[200px]">
                <p className="text-emerald-100 text-sm mb-2">Onboarding Progress</p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-bold">{progress}%</span>
                  <span className="text-emerald-100 mb-1">complete</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/30" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsCard
            title="Pending Tasks"
            value={pendingTasks}
            icon={Clock}
            iconClassName="bg-amber-100"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatsCard
            title="Completed Tasks"
            value={completedTasks}
            icon={CheckCircle2}
            iconClassName="bg-emerald-100"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatsCard
            title="Documents Submitted"
            value={documents.length}
            icon={FileText}
            iconClassName="bg-blue-100"
          />
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
              <Link to={createPageUrl('EmployeeTasks')}>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="All caught up!"
                  description="You have no pending tasks."
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <Link
                      key={task.id}
                      to={createPageUrl('EmployeeTasks') + `?taskId=${task.id}`}
                      className="block p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{task.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-1.5 mt-3 text-sm text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          Due {format(parseISO(task.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl('EmployeeDocuments')}>
                <div className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">Upload Documents</h4>
                      <p className="text-sm text-slate-500">Submit required documents</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl('EmployeeEquipment')}>
                <div className="p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">Request Equipment</h4>
                      <p className="text-sm text-slate-500">Browse and request items</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl('EmployeeTasks')}>
                <div className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <CheckSquare className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">Complete Tasks</h4>
                      <p className="text-sm text-slate-500">{pendingTasks} tasks remaining</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Document Status</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Start by uploading your required documents."
                action={() => window.location.href = createPageUrl('EmployeeDocuments')}
                actionLabel="Upload Documents"
                className="py-8"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b">
                      <th className="pb-3 font-medium">Document</th>
                      <th className="pb-3 font-medium">Submitted</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-medium text-slate-800">{doc.document_type_name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-slate-500">
                          {doc.submitted_date ? format(parseISO(doc.submitted_date), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="py-4">
                          <StatusBadge status={doc.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}