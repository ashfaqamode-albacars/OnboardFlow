import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Upload, Clock, CheckCircle2, XCircle, 
  Eye, Download, Plus, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function EmployeeDocuments() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
        
        const [docsData, typesData] = await Promise.all([
          base44.entities.Document.filter({ employee_id: emp.id }),
          base44.entities.DocumentType.filter({ is_active: true })
        ]);
        
        setDocuments(docsData);
        setDocumentTypes(typesData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedType || !employee) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const docType = documentTypes.find(t => t.id === selectedType);
      
      await base44.entities.Document.create({
        employee_id: employee.id,
        document_type_id: selectedType,
        document_type_name: docType?.name || 'Unknown',
        file_url,
        status: 'pending',
        submitted_date: new Date().toISOString()
      });

      await loadData();
      setUploadOpen(false);
      setFile(null);
      setSelectedType('');
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const filterDocuments = (status) => {
    if (status === 'all') return documents;
    return documents.filter(d => d.status === status);
  };

  const getSubmittedTypes = () => documents.map(d => d.document_type_id);
  const getMissingTypes = () => documentTypes.filter(t => 
    t.is_required && !getSubmittedTypes().includes(t.id)
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pendingCount = filterDocuments('pending').length;
  const approvedCount = filterDocuments('approved').length;
  const rejectedCount = filterDocuments('rejected').length;
  const missingTypes = getMissingTypes();

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="My Documents"
        description="Upload and track your document submissions"
        action={() => setUploadOpen(true)}
        actionLabel="Upload Document"
        actionIcon={Upload}
      />

      {/* Missing Documents Alert */}
      {missingTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Missing Required Documents</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Please upload the following: {missingTypes.map(t => t.name).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterDocuments(tab).length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents found"
                description={tab === 'all' ? "Upload your first document to get started." : `No ${tab} documents.`}
                action={() => setUploadOpen(true)}
                actionLabel="Upload Document"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterDocuments(tab).map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center",
                            doc.status === 'approved' ? "bg-emerald-100" :
                            doc.status === 'rejected' ? "bg-red-100" : "bg-blue-100"
                          )}>
                            <FileText className={cn(
                              "h-6 w-6",
                              doc.status === 'approved' ? "text-emerald-600" :
                              doc.status === 'rejected' ? "text-red-600" : "text-blue-600"
                            )} />
                          </div>
                          <StatusBadge status={doc.status} />
                        </div>
                        
                        <h3 className="font-semibold text-slate-800 mb-1">{doc.document_type_name}</h3>
                        
                        {doc.submitted_date && (
                          <p className="text-sm text-slate-500 mb-4">
                            Submitted {format(parseISO(doc.submitted_date), 'MMM d, yyyy')}
                          </p>
                        )}

                        {doc.status === 'rejected' && doc.rejection_reason && (
                          <div className="bg-red-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-700">
                              <span className="font-medium">Reason: </span>
                              {doc.rejection_reason}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {doc.file_url && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
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
                        </div>

                        {doc.status === 'rejected' && (
                          <Button 
                            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700"
                            size="sm"
                            onClick={() => {
                              setSelectedType(doc.document_type_id);
                              setUploadOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" /> Re-upload
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name} {type.is_required && '*'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File</Label>
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                   onClick={() => document.getElementById('file-input').click()}>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-emerald-600" />
                    <span className="font-medium text-slate-700">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-400 mt-1">PDF, JPG, PNG, DOC (max 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || !selectedType || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}