import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, FileText, Package, CheckSquare, ArrowRight, 
  Clock, CheckCircle2, AlertCircle, TrendingUp, UserPlus
} from 'lucide-react';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import StatsCard from '../components/shared/StatsCard';
import StatusBadge from '../components/shared/StatusBadge';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [equipmentRequests, setEquipmentRequests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await Entities.User.me();
      setUser(userData);

      const isAdmin = userData.role === 'admin';

      // For admins, show all. For HR, show assigned employees only
      const employeeFilter = isAdmin ? {} : { assigned_hr: userData.email };

      const [empData, docsData, equipData, tasksData] = await Promise.all([
        Entities.Employee.filter(employeeFilter),
        Entities.Document.list(),
        Entities.EquipmentRequest.list(),
        Entities.Task.filter({ assigned_role: 'hr' })
      ]);

      setEmployees(empData);
      
      // Filter documents and equipment for assigned employees
      const employeeIds = empData.map(e => e.id);
      setDocuments(isAdmin ? docsData : docsData.filter(d => employeeIds.includes(d.employee_id)));
      setEquipmentRequests(isAdmin ? equipData : equipData.filter(e => employeeIds.includes(e.employee_id)));
      setTasks(tasksData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pendingDocs = documents.filter(d => d.status === 'pending');
  const pendingEquip = equipmentRequests.filter(e => e.status === 'pending');
  const activeEmployees = employees.filter(e => e.onboarding_status === 'in_progress');
  const completedEmployees = employees.filter(e => e.onboarding_status === 'completed');

  const onboardingData = [
    { name: 'Not Started', value: employees.filter(e => e.onboarding_status === 'not_started').length, color: '#94a3b8' },
    { name: 'In Progress', value: activeEmployees.length, color: '#3b82f6' },
    { name: 'Completed', value: completedEmployees.length, color: '#10b981' },
  ];

  const recentEmployees = employees
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  const weeklyData = [
    { name: 'Mon', docs: 3, equip: 2 },
    { name: 'Tue', docs: 5, equip: 1 },
    { name: 'Wed', docs: 2, equip: 3 },
    { name: 'Thu', docs: 4, equip: 2 },
    { name: 'Fri', docs: 6, equip: 4 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage onboarding and employee requests</p>
        </div>
        <Link to={createPageUrl('HREmployees')}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="h-4 w-4 mr-2" /> Add Employee
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            iconClassName="bg-blue-100"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatsCard
            title="Pending Documents"
            value={pendingDocs.length}
            icon={FileText}
            iconClassName="bg-amber-100"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatsCard
            title="Equipment Requests"
            value={pendingEquip.length}
            icon={Package}
            iconClassName="bg-purple-100"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <StatsCard
            title="Active Onboarding"
            value={activeEmployees.length}
            icon={TrendingUp}
            iconClassName="bg-emerald-100"
          />
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Onboarding Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Onboarding Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={onboardingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={5}
                    >
                      {onboardingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {onboardingData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
              <div className="flex gap-2">
                <Link to={createPageUrl('HRDocuments')}>
                  <Button variant="ghost" size="sm" className="text-emerald-600">
                    Documents <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link to={createPageUrl('HREquipment')}>
                  <Button variant="ghost" size="sm" className="text-emerald-600">
                    Equipment <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingDocs.slice(0, 3).map((doc) => {
                  const emp = employees.find(e => e.id === doc.employee_id);
                  return (
                    <Link 
                      key={doc.id} 
                      to={createPageUrl('HRDocuments')}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{doc.document_type_name}</p>
                          <p className="text-sm text-slate-500">{emp?.full_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <StatusBadge status="pending" />
                    </Link>
                  );
                })}
                {pendingEquip.slice(0, 2).map((equip) => {
                  const emp = employees.find(e => e.id === equip.employee_id);
                  return (
                    <Link 
                      key={equip.id} 
                      to={createPageUrl('HREquipment')}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{equip.equipment_name}</p>
                          <p className="text-sm text-slate-500">{emp?.full_name || 'Unknown'}</p>
                        </div>
                      </div>
                      <StatusBadge status="pending" />
                    </Link>
                  );
                })}
                {pendingDocs.length === 0 && pendingEquip.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No pending approvals
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Employees */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Employees</CardTitle>
            <Link to={createPageUrl('HREmployees')}>
              <Button variant="ghost" size="sm" className="text-emerald-600">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Position</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Start Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-700 font-medium">
                              {emp.full_name?.charAt(0) || 'E'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{emp.full_name}</p>
                            <p className="text-sm text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">{emp.position || '-'}</td>
                      <td className="py-4 text-slate-600">{emp.department || '-'}</td>
                      <td className="py-4 text-slate-600">
                        {emp.start_date ? format(parseISO(emp.start_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={emp.onboarding_status || 'not_started'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}