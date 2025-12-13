import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckSquare, Search, Clock, CheckCircle2, AlertCircle, Calendar
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function HRTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await Entities.User.me();
      setUser(userData);

      const isAdmin = userData.role === 'admin';
      const employeeFilter = isAdmin ? {} : { assigned_hr: userData.email };

      const [empData, tasksData] = await Promise.all([
        Entities.Employee.filter(employeeFilter),
        Entities.Task.list()
      ]);

      setEmployees(empData);
      
      // Get all tasks for assigned employees
      const employeeIds = empData.map(e => e.id);
      setTasks(isAdmin ? tasksData : tasksData.filter(t => employeeIds.includes(t.employee_id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = (status) => {
    let filtered = tasks;
    if (status === 'pending') {
      filtered = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    } else if (status === 'overdue') {
      filtered = tasks.filter(t => 
        t.status !== 'completed' && t.due_date && isAfter(new Date(), parseISO(t.due_date))
      );
    } else if (status !== 'all') {
      filtered = tasks.filter(t => t.status === status);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const emp = employees.find(e => e.id === t.employee_id);
        return t.title?.toLowerCase().includes(query) ||
               emp?.full_name?.toLowerCase().includes(query);
      });
    }
    return filtered;
  };

  const getEmployee = (employeeId) => employees.find(e => e.id === employeeId);

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
        title="Task Overview"
        description="Monitor employee onboarding progress"
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by employee or task..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

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
            Completed ({completedCount})
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
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {['pending', 'completed', 'overdue', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterTasks(tab).length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks found"
                description={tab === 'pending' ? "All tasks are up to date." : `No ${tab} tasks.`}
              />
            ) : (
              <div className="space-y-4">
                {filterTasks(tab).map((task, index) => {
                  const emp = getEmployee(task.employee_id);
                  const isOverdue = task.due_date && isAfter(new Date(), parseISO(task.due_date)) && task.status !== 'completed';
                  
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className={cn(
                        "border-0 shadow-sm",
                        isOverdue && "border-l-4 border-l-red-500"
                      )}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                task.status === 'completed' ? "bg-emerald-100" :
                                isOverdue ? "bg-red-100" : "bg-blue-100"
                              )}>
                                <CheckSquare className={cn(
                                  "h-6 w-6",
                                  task.status === 'completed' ? "text-emerald-600" :
                                  isOverdue ? "text-red-600" : "text-blue-600"
                                )} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                <p className="text-slate-500 mt-1">
                                  {emp?.full_name || 'Unknown Employee'}
                                </p>
                                {task.description && (
                                  <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-3">
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
                                    {task.type?.replace('_', ' ')} • Assigned to {task.assigned_role}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <StatusBadge status={isOverdue && task.status !== 'completed' ? 'overdue' : task.status} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}