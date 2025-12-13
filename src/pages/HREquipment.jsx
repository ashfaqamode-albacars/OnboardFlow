import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, Search, Clock, CheckCircle2, XCircle, Truck,
  Check, X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function HREquipment() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await Entities.User.me();
      setUser(userData);

      const isAdmin = userData.role === 'admin';
      const employeeFilter = isAdmin ? {} : { assigned_hr: userData.email };

      const [empData, requestsData] = await Promise.all([
        Entities.Employee.filter(employeeFilter),
        Entities.EquipmentRequest.list()
      ]);

      setEmployees(empData);
      
      const employeeIds = empData.map(e => e.id);
      setRequests(isAdmin ? requestsData : requestsData.filter(r => employeeIds.includes(r.employee_id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    setProcessing(true);
    try {
      await Entities.EquipmentRequest.update(request.id, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString()
      });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkDelivered = async (request) => {
    setProcessing(true);
    try {
      await Entities.EquipmentRequest.update(request.id, {
        status: 'delivered'
      });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason) return;
    
    setProcessing(true);
    try {
      await Entities.EquipmentRequest.update(selectedRequest.id, {
        status: 'rejected',
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
        rejection_reason: rejectReason
      });
      await loadData();
      setSelectedRequest(null);
      setRejectReason('');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const filterRequests = (status) => {
    let filtered = requests;
    if (status !== 'all') {
      filtered = requests.filter(r => r.status === status);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        return r.equipment_name?.toLowerCase().includes(query) ||
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

  const pendingCount = filterRequests('pending').length;
  const approvedCount = filterRequests('approved').length;
  const deliveredCount = filterRequests('delivered').length;
  const rejectedCount = filterRequests('rejected').length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Equipment Requests"
        description="Review and process equipment requests"
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by employee or equipment..."
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
          <TabsTrigger value="delivered" className="gap-2">
            <Truck className="h-4 w-4" />
            Delivered ({deliveredCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'delivered', 'rejected'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filterRequests(tab).length === 0 ? (
            <EmptyState
              icon={Package}
              title="No requests found"
              description={tab === 'pending' ? "No pending requests to review." : `No ${tab} requests.`}
            />
            ) : (
            <div className="space-y-4">
              {filterRequests(tab).map((request, index) => (
                <EquipmentRequestCard 
                  key={request.id} 
                  request={request} 
                  employees={employees}
                  index={index}
                  onApprove={handleApprove}
                  onReject={setSelectedRequest}
                  onDeliver={handleMarkDelivered}
                  processing={processing}
                />
              ))}
            </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null);
        setRejectReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-slate-600 mb-4">
              You are about to reject the request for "{selectedRequest?.equipment_name}". 
              Please provide a reason for the rejection.
            </p>
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this request is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setRejectReason('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || processing}
            >
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EquipmentRequestCard({ request, employees, index, onApprove, onReject, onDeliver, processing }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [request.id]);

  const loadItems = async () => {
    try {
      const itemsData = await Entities.EquipmentRequestItem.filter({ request_id: request.id });
      setItems(itemsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const emp = employees.find(e => e.id === request.employee_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                request.status === 'delivered' ? "bg-emerald-100" :
                request.status === 'approved' ? "bg-blue-100" :
                request.status === 'rejected' ? "bg-red-100" : "bg-purple-100"
              )}>
                <Package className={cn(
                  "h-6 w-6",
                  request.status === 'delivered' ? "text-emerald-600" :
                  request.status === 'approved' ? "text-blue-600" :
                  request.status === 'rejected' ? "text-red-600" : "text-purple-600"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">
                  {emp?.full_name || 'Unknown Employee'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Requested {format(parseISO(request.created_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} />
              <div className="flex gap-2">
                {request.status === 'pending' && (
                  <>
                    <Button 
                      size="icon"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => onApprove(request)}
                      disabled={processing}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon"
                      variant="destructive"
                      onClick={() => onReject(request)}
                      disabled={processing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {request.status === 'approved' && (
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => onDeliver(request)}
                    disabled={processing}
                  >
                    <Truck className="h-4 w-4 mr-1" /> Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-20 bg-slate-50 rounded-lg animate-pulse" />
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{item.equipment_name}</p>
                    {item.notes && <p className="text-sm text-slate-500">{item.notes}</p>}
                  </div>
                  <Badge variant="outline">Qty: {item.quantity}</Badge>
                </div>
              ))}
            </div>
          )}

          {request.overall_notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">{request.overall_notes}</p>
            </div>
          )}

          {request.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-medium">Reason: </span>{request.rejection_reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}