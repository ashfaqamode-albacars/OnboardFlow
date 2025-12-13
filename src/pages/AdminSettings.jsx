import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, FileText, Package, Plus, Edit, Trash2, 
  Upload, Laptop, Smartphone, Monitor, Headphones
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';

const categoryIcons = {
  laptop: Laptop,
  mobile: Smartphone,
  accessories: Headphones,
  furniture: Monitor,
  software: Package,
  other: Package
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [activeTab, setActiveTab] = useState('document-types');
  
  const [docTypeOpen, setDocTypeOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [docTypeForm, setDocTypeForm] = useState({ name: '', description: '', is_required: true, is_active: true });
  
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({ name: '', description: '', category: 'other', is_available: true, image_url: '' });
  
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docTypesData, equipmentData] = await Promise.all([
        base44.entities.DocumentType.list(),
        base44.entities.Equipment.list()
      ]);
      setDocumentTypes(docTypesData);
      setEquipment(equipmentData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Document Types handlers
  const handleEditDocType = (docType) => {
    setSelectedDocType(docType);
    setDocTypeForm({
      name: docType.name,
      description: docType.description || '',
      is_required: docType.is_required !== false,
      is_active: docType.is_active !== false
    });
    setDocTypeOpen(true);
  };

  const handleCreateDocType = () => {
    setSelectedDocType(null);
    setDocTypeForm({ name: '', description: '', is_required: true, is_active: true });
    setDocTypeOpen(true);
  };

  const handleSaveDocType = async () => {
    if (!docTypeForm.name) return;
    setSubmitting(true);
    try {
      if (selectedDocType) {
        await base44.entities.DocumentType.update(selectedDocType.id, docTypeForm);
      } else {
        await base44.entities.DocumentType.create(docTypeForm);
      }
      await loadData();
      setDocTypeOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocType = async (docType) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;
    try {
      await base44.entities.DocumentType.delete(docType.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Equipment handlers
  const handleEditEquipment = (item) => {
    setSelectedEquipment(item);
    setEquipmentForm({
      name: item.name,
      description: item.description || '',
      category: item.category || 'other',
      is_available: item.is_available !== false,
      image_url: item.image_url || ''
    });
    setEquipmentOpen(true);
  };

  const handleCreateEquipment = () => {
    setSelectedEquipment(null);
    setEquipmentForm({ name: '', description: '', category: 'other', is_available: true, image_url: '' });
    setEquipmentOpen(true);
  };

  const handleSaveEquipment = async () => {
    if (!equipmentForm.name) return;
    setSubmitting(true);
    try {
      if (selectedEquipment) {
        await base44.entities.Equipment.update(selectedEquipment.id, equipmentForm);
      } else {
        await base44.entities.Equipment.create(equipmentForm);
      }
      await loadData();
      setEquipmentOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (item) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await base44.entities.Equipment.delete(item.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEquipmentForm({ ...equipmentForm, image_url: file_url });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Manage document types and equipment catalog"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-slate-100">
          <TabsTrigger value="document-types" className="gap-2">
            <FileText className="h-4 w-4" />
            Document Types
          </TabsTrigger>
          <TabsTrigger value="equipment" className="gap-2">
            <Package className="h-4 w-4" />
            Equipment Catalog
          </TabsTrigger>
        </TabsList>

        {/* Document Types Tab */}
        <TabsContent value="document-types">
          <div className="flex justify-end mb-6">
            <Button onClick={handleCreateDocType} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Document Type
            </Button>
          </div>

          {documentTypes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No document types"
              description="Create document types that employees need to submit."
              action={handleCreateDocType}
              actionLabel="Add Document Type"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTypes.map((docType, index) => (
                <motion.div
                  key={docType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-800">{docType.name}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{docType.description || 'No description'}</p>
                            <div className="flex gap-2 mt-2">
                              {docType.is_required && (
                                <Badge className="bg-red-100 text-red-700">Required</Badge>
                              )}
                              {!docType.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditDocType(docType)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDocType(docType)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <div className="flex justify-end mb-6">
            <Button onClick={handleCreateEquipment} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Equipment
            </Button>
          </div>

          {equipment.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No equipment"
              description="Add equipment items that employees can request."
              action={handleCreateEquipment}
              actionLabel="Add Equipment"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {equipment.map((item, index) => {
                const Icon = categoryIcons[item.category] || Package;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        {item.image_url ? (
                          <div className="aspect-square rounded-lg bg-slate-100 mb-3 overflow-hidden">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-square rounded-lg bg-slate-100 mb-3 flex items-center justify-center">
                            <Icon className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-slate-800">{item.name}</h3>
                            <Badge variant="secondary" className="mt-1 capitalize">
                              {item.category?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditEquipment(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipment(item)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
      </Tabs>

      {/* Document Type Dialog */}
      <Dialog open={docTypeOpen} onOpenChange={setDocTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDocType ? 'Edit Document Type' : 'Add Document Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={docTypeForm.name}
                onChange={(e) => setDocTypeForm({ ...docTypeForm, name: e.target.value })}
                placeholder="Emirates ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={docTypeForm.description}
                onChange={(e) => setDocTypeForm({ ...docTypeForm, description: e.target.value })}
                placeholder="Copy of Emirates ID (front and back)"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Required Document</Label>
              <Switch
                checked={docTypeForm.is_required}
                onCheckedChange={(checked) => setDocTypeForm({ ...docTypeForm, is_required: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Active</Label>
              <Switch
                checked={docTypeForm.is_active}
                onCheckedChange={(checked) => setDocTypeForm({ ...docTypeForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocTypeOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveDocType} 
              disabled={!docTypeForm.name || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Dialog */}
      <Dialog open={equipmentOpen} onOpenChange={setEquipmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={equipmentForm.name}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                placeholder="MacBook Pro 14"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={equipmentForm.description}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                placeholder="Apple MacBook Pro 14-inch, M3 chip..."
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={equipmentForm.category}
                onValueChange={(value) => setEquipmentForm({ ...equipmentForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                onClick={() => document.getElementById('equip-image').click()}
              >
                <input
                  id="equip-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {uploading ? (
                  <p className="text-slate-500">Uploading...</p>
                ) : equipmentForm.image_url ? (
                  <img src={equipmentForm.image_url} alt="Preview" className="h-24 mx-auto rounded" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to upload image</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Available</Label>
              <Switch
                checked={equipmentForm.is_available}
                onCheckedChange={(checked) => setEquipmentForm({ ...equipmentForm, is_available: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveEquipment} 
              disabled={!equipmentForm.name || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}