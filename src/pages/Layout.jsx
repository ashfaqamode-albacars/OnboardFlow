
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Entities from '@/api/entities';
import { createPageUrl } from '../utils';
import { 
  Home, FileText, Package, CheckSquare, Settings, Users, 
  Building2, ChevronLeft, ChevronRight, LogOut, User,
  Workflow, FormInput, FileSignature, Menu, X, Bell, BookOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await Entities.User.me();
      setUser(userData);
      
      // Check if user is an employee
      if (userData.role === 'user') {
        const employees = await Entities.Employee.filter({ user_email: userData.email });
        if (employees.length > 0) {
          setEmployee(employees[0]);
        }
      }
      
      // Get pending tasks count for HR/Admin
      if (userData.role === 'admin') {
        const pendingDocs = await Entities.Document.filter({ status: 'pending' });
        const pendingEquip = await Entities.EquipmentRequest.filter({ status: 'pending' });
        setPendingCount(pendingDocs.length + pendingEquip.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isHR = isAdmin || user?.role === 'admin'; // Could extend with HR role
  const isEmployee = !!employee;

  const handleLogout = () => {
    Entities.User.logout();
  };

  // Employee navigation
  const employeeNavItems = [
    { name: 'Dashboard', icon: Home, page: 'EmployeeDashboard' },
    { name: 'My Tasks', icon: CheckSquare, page: 'EmployeeTasks' },
    { name: 'Documents', icon: FileText, page: 'EmployeeDocuments' },
    { name: 'Equipment', icon: Package, page: 'EmployeeEquipment' },
    { name: 'Training', icon: BookOpen, page: 'EmployeeTraining' },
  ];

  // HR/Admin navigation
  const hrNavItems = [
    { name: 'Dashboard', icon: Home, page: 'HRDashboard' },
    { name: 'Employees', icon: Users, page: 'HREmployees' },
    { name: 'Documents', icon: FileText, page: 'HRDocuments' },
    { name: 'Equipment', icon: Package, page: 'HREquipment' },
    { name: 'Tasks', icon: CheckSquare, page: 'HRTasks' },
    { name: 'Training', icon: BookOpen, page: 'HRTraining' },
  ];

  // Admin only navigation
  const adminNavItems = [
    { name: 'Workflows', icon: Workflow, page: 'AdminWorkflows' },
    { name: 'Form Builder', icon: FormInput, page: 'AdminForms' },
    { name: 'Document Templates', icon: FileSignature, page: 'AdminDocumentTemplates' },
    { name: 'Course Builder', icon: BookOpen, page: 'AdminCourses' },
    { name: 'Settings', icon: Settings, page: 'AdminSettings' },
  ];

  const getNavItems = () => {
    if (isEmployee && !isAdmin) {
      return employeeNavItems;
    }
    if (isAdmin) {
      return [...hrNavItems, ...adminNavItems];
    }
    return hrNavItems;
  };

  const navItems = getNavItems();

  // Public pages without layout
  if (!user || currentPageName === 'Login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800">OnboardHub</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-slate-800">OnboardHub</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <Badge 
              variant="secondary" 
              className={cn(
                "w-full justify-center py-1",
                isAdmin ? "bg-purple-100 text-purple-700" : 
                isEmployee ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              )}
            >
              {isAdmin ? 'Administrator' : isEmployee ? 'Employee' : 'HR Manager'}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-emerald-600")} />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100 bg-white">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors",
                collapsed && "justify-center"
              )}>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-medium">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0",
        collapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
