import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, ShoppingCart, Clock, CheckCircle2, XCircle, 
  Laptop, Smartphone, Monitor, Headphones, Truck, Plus, Minus, Trash2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PageHeader from '../components/shared/PageHeader';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const categoryIcons = {
  laptop: Laptop,
  mobile: Smartphone,
  accessories: Headphones,
  furniture: Monitor,
  software: Package,
  other: Package
};

export default function EmployeeEquipment() {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');
  const [taskId, setTaskId] = useState(null);

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('taskId');
    if (tid) setTaskId(tid);
  }, []);

  const loadData = async () => {
    try {
      const user = await Entities.User.me();
      const employees = await Entities.Employee.filter({ user_email: user.email });
      
      if (employees.length > 0) {
        const emp = employees[0];
        setEmployee(emp);
        
        const [equipData, requestsData] = await Promise.all([
          Entities.Equipment.filter({ is_available: true }),
          Entities.EquipmentRequest.filter({ employee_id: emp.id })
        ]);
        
        setEquipment(equipData);
        setRequests(requestsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.equipment_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.equipment_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, {
        equipment_id: item.id,
        equipment_name: item.name,
        equipment_category: item.category,
        quantity: 1,
        notes: ''
      }]);
    }
  };

  const updateCartItem = (equipmentId, field, value) => {
    setCart(cart.map(c => 
      c.equipment_id === equipmentId ? { ...c, [field]: value } : c
    ));
  };

  const removeFromCart = (equipmentId) => {
    setCart(cart.filter(c => c.equipment_id !== equipmentId));
  };

  const handleSubmitRequest = async () => {
    if (!employee || cart.length === 0) return;
    
    setSubmitting(true);
    try {
      const request = await Entities.EquipmentRequest.create({
        employee_id: employee.id,
        task_id: taskId,
        overall_notes: overallNotes,
        status: 'pending'
      });

      await Promise.all(
        cart.map(item => 
          Entities.EquipmentRequestItem.create({
            request_id: request.id,
            ...item
          })
        )
      );

      // If this was from a task, mark task as complete
      if (taskId) {
        const tasks = await Entities.Task.filter({ id: taskId });
        if (tasks.length > 0) {
          await Entities.Task.update(taskId, {
            status: 'completed',
            completed_date: new Date().toISOString(),
            related_id: request.id
          });

          // Create HR approval task
          const task = tasks[0];
          await Entities.Task.create({
            employee_id: employee.id,
            title: `Approve Equipment Request - ${employee.full_name}`,
            description: `Review and approve equipment request with ${cart.length} item(s)`,
            type: 'approval',
            status: 'pending',
            assigned_to: employee.assigned_hr,
            related_id: request.id
          });
        }
      }

      await loadData();
      setCart([]);
      setOverallNotes('');
      setCartOpen(false);
      setActiveTab('requests');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Equipment"
        description="Browse available equipment and track your requests"
      >
        {cart.length > 0 && (
          <Button onClick={() => setCartOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 relative">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cart.length})
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="h-4 w-4" />
            Equipment Catalog
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            My Requests
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          {Object.keys(groupedEquipment).length === 0 ? (
            <EmptyState
              icon={Package}
              title="No equipment available"
              description="Check back later for available equipment."
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEquipment).map(([category, items]) => {
                const Icon = categoryIcons[category] || Package;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className="h-5 w-5 text-slate-600" />
                      <h2 className="text-lg font-semibold text-slate-800 capitalize">
                        {category.replace('_', ' ')}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {items.map((item, index) => {
                        const inCart = cart.find(c => c.equipment_id === item.id);
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
                              <CardContent className="p-4">
                                {item.image_url ? (
                                  <div className="aspect-square rounded-lg bg-slate-100 mb-4 overflow-hidden">
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square rounded-lg bg-slate-100 mb-4 flex items-center justify-center">
                                    <Icon className="h-12 w-12 text-slate-300" />
                                  </div>
                                )}
                                <h3 className="font-medium text-slate-800">{item.name}</h3>
                                {item.description && (
                                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                                )}
                                <Button 
                                  className={cn(
                                    "w-full mt-4",
                                    inCart ? "bg-slate-600 hover:bg-slate-700" : "bg-emerald-600 hover:bg-emerald-700"
                                  )}
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                >
                                  {inCart ? (
                                    <>In Cart ({inCart.quantity})</>
                                  ) : (
                                    <><Plus className="h-4 w-4 mr-1" /> Add to Cart</>
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No requests yet"
              description="Browse the catalog to request equipment."
              action={() => setActiveTab('catalog')}
              actionLabel="Browse Catalog"
            />
          ) : (
            <div className="space-y-4">
              {requests.map((request, index) => (
                <EquipmentRequestCard key={request.id} request={request} index={index} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Equipment Request</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {cart.map((item) => (
              <Card key={item.equipment_id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{item.equipment_name}</h4>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {item.equipment_category?.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-3 mt-3">
                        <Label className="text-sm">Quantity:</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateCartItem(item.equipment_id, 'quantity', Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateCartItem(item.equipment_id, 'quantity', item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Notes for this item (optional)"
                        value={item.notes}
                        onChange={(e) => updateCartItem(item.equipment_id, 'notes', e.target.value)}
                        className="mt-3"
                        rows={2}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.equipment_id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="space-y-2">
              <Label>Overall Notes (optional)</Label>
              <Textarea
                placeholder="General notes for your entire equipment request..."
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Total items:</strong> {cart.reduce((sum, item) => sum + item.quantity, 0)} ({cart.length} different item{cart.length !== 1 ? 's' : ''})
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </Button>
            <Button 
              onClick={handleSubmitRequest} 
              disabled={cart.length === 0 || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EquipmentRequestCard({ request, index }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-800">
                  Equipment Request #{request.id.slice(-8)}
                </h3>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Requested {format(parseISO(request.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-20" />
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