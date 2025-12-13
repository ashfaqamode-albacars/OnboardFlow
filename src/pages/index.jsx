import Layout from "./Layout.jsx";

import EmployeeDashboard from "./EmployeeDashboard";

import EmployeeTasks from "./EmployeeTasks";

import EmployeeDocuments from "./EmployeeDocuments";

import EmployeeEquipment from "./EmployeeEquipment";

import HRDashboard from "./HRDashboard";

import HREmployees from "./HREmployees";

import HRDocuments from "./HRDocuments";

import HREquipment from "./HREquipment";

import HRTasks from "./HRTasks";

import AdminWorkflows from "./AdminWorkflows";

import AdminForms from "./AdminForms";

import AdminDocumentTemplates from "./AdminDocumentTemplates";

import AdminSettings from "./AdminSettings";

import EmployeeTraining from "./EmployeeTraining";

import CourseViewer from "./CourseViewer";

import HRTraining from "./HRTraining";

import AdminCourses from "./AdminCourses";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    EmployeeDashboard: EmployeeDashboard,
    
    EmployeeTasks: EmployeeTasks,
    
    EmployeeDocuments: EmployeeDocuments,
    
    EmployeeEquipment: EmployeeEquipment,
    
    HRDashboard: HRDashboard,
    
    HREmployees: HREmployees,
    
    HRDocuments: HRDocuments,
    
    HREquipment: HREquipment,
    
    HRTasks: HRTasks,
    
    AdminWorkflows: AdminWorkflows,
    
    AdminForms: AdminForms,
    
    AdminDocumentTemplates: AdminDocumentTemplates,
    
    AdminSettings: AdminSettings,
    
    EmployeeTraining: EmployeeTraining,
    
    CourseViewer: CourseViewer,
    
    HRTraining: HRTraining,
    
    AdminCourses: AdminCourses,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<EmployeeDashboard />} />
                
                
                <Route path="/EmployeeDashboard" element={<EmployeeDashboard />} />
                
                <Route path="/EmployeeTasks" element={<EmployeeTasks />} />
                
                <Route path="/EmployeeDocuments" element={<EmployeeDocuments />} />
                
                <Route path="/EmployeeEquipment" element={<EmployeeEquipment />} />
                
                <Route path="/HRDashboard" element={<HRDashboard />} />
                
                <Route path="/HREmployees" element={<HREmployees />} />
                
                <Route path="/HRDocuments" element={<HRDocuments />} />
                
                <Route path="/HREquipment" element={<HREquipment />} />
                
                <Route path="/HRTasks" element={<HRTasks />} />
                
                <Route path="/AdminWorkflows" element={<AdminWorkflows />} />
                
                <Route path="/AdminForms" element={<AdminForms />} />
                
                <Route path="/AdminDocumentTemplates" element={<AdminDocumentTemplates />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/EmployeeTraining" element={<EmployeeTraining />} />
                
                <Route path="/CourseViewer" element={<CourseViewer />} />
                
                <Route path="/HRTraining" element={<HRTraining />} />
                
                <Route path="/AdminCourses" element={<AdminCourses />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}