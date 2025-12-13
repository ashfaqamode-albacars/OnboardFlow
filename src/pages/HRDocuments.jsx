import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Search, Clock, CheckCircle2, XCircle, 
  Eye, Download, Check, X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function HRDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const isAdmin = userData.role === 'admin';
      const employeeFilter = isAdmin ? {} : { assigned_hr: userData.email };

      const [empData, docsData] = await Promise.all([
        base44.entities.Employee.filter(employeeFilter),
        base44.entities.Document.list()
      ]);

      setEmployees(empData);
      
      const employeeIds = empData.map(e => e.id);
      setDocuments(isAdmin ? docsData : docsData.filter(d => employeeIds.includes(d.employee_id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doc) => {
    setProcessing(true);
    try {
      await base44.entities.Document.update(doc.id, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString()
      });
      await loadData();
      setSelectedDoc(null);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectReason) return;
    
    setProcessing(true);
    try {
      await base44.entities.Document.update(selectedDoc.id, {
        status: 'rejected',
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
        rejection_reason: rejectReason
      });
      await loadData();
      setSelectedDoc(null);
      setRejectReason('');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const filterDocuments = (status) => {
    let filtered = documents;
    if (status !== 'all') {
      filtered = documents.filter(d => d.status === status);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const emp = employees.find(e => e.id === d.employee_id);
        return d.document_type_name?.toLowerCase().includes(query) ||
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

  const pendingCount = filterDocuments('pending').length;
  const approvedCount = filterDocuments('approved').length;
  const rejectedCount = filterDocuments('rejected').length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Document Review"
        description="Review and approve employee documents"
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by employee or document type..."
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
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected', 'all'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterDocuments(tab).length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents found"
                description={tab === 'pending' ? "No pending documents to review." : `No ${tab} documents.`}
              />
            ) : (
              <div className="space-y-4">
                {filterDocuments(tab).map((doc, index) => {
                  const emp = getEmployee(doc.employee_id);
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                doc.status === 'approved' ? "bg-emerald-100" :
                                doc.status === 'rejected' ? "bg-red-100" : "bg-blue-100"
                              )}>
                                <FileText className={cn(
                                  "h-6 w-6",
                                  doc.status === 'approved' ? "text-emerald-600" :
                                  doc.status === 'rejected' ? "text-red-600" : "text-blue-600"
                                )} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">{doc.document_type_name}</h3>
                                <p className="text-slate-500 mt-1">
                                  {emp?.full_name || 'Unknown Employee'}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                  Submitted {doc.submitted_date ? format(parseISO(doc.submitted_date), 'MMM d, yyyy') : '-'}
                                </p>
                                {doc.rejection_reason && (
                                  <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                                    Reason: {doc.rejection_reason}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={doc.status} />
                              <div className="flex gap-2">
                                {doc.file_url && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => window.open(doc.file_url, '_blank')}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = doc.file_url;
                                        link.download = doc.document_type_name;
                                        link.click();
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {doc.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="icon"
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                      onClick={() => handleApprove(doc)}
                                      disabled={processing}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon"
                                      variant="destructive"
                                      onClick={() => setSelectedDoc(doc)}
                                      disabled={processing}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
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
        ))}
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => {
        setSelectedDoc(null);
        setRejectReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-slate-600 mb-4">
              You are about to reject "{selectedDoc?.document_type_name}". 
              Please provide a reason for the rejection.
            </p>
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this document is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedDoc(null);
              setRejectReason('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || processing}
            >
              {processing ? 'Rejecting...' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}