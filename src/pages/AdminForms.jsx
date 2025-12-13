import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  FormInput, Plus, Edit, Trash2, GripVertical,
  Type, Mail, Phone, Calendar, List, FileText, CheckSquare, Hash
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const fieldTypeOptions = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'textarea', label: 'Text Area', icon: FileText },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'number', label: 'Number', icon: Hash }
];

const formTypeOptions = [
  { value: 'new_employee', label: 'New Employee' },
  { value: 'personal_info', label: 'Personal Information' },
  { value: 'emergency_contact', label: 'Emergency Contact' },
  { value: 'bank_details', label: 'Bank Details' },
  { value: 'custom', label: 'Custom' }
];

export default function AdminForms() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    form_type: 'custom',
    is_active: true,
    fields: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const formsData = await Entities.FormTemplate.list();
      setForms(formsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (form) => {
    setSelectedForm(form);
    setFormData({
      name: form.name,
      description: form.description || '',
      form_type: form.form_type || 'custom',
      is_active: form.is_active !== false,
      fields: form.fields || []
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    setSelectedForm(null);
    setFormData({
      name: '',
      description: '',
      form_type: 'custom',
      is_active: true,
      fields: []
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        fields: formData.fields.map((field, index) => ({
          ...field,
          order: index
        }))
      };

      if (selectedForm) {
        await Entities.FormTemplate.update(selectedForm.id, data);
      } else {
        await Entities.FormTemplate.create(data);
      }

      await loadData();
      setEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (form) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      await Entities.FormTemplate.delete(form.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      options: []
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  const updateField = (index, key, value) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData({ ...formData, fields: items });
  };

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

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Form Builder"
        description="Create and customize form templates"
        action={handleCreate}
        actionLabel="Create Form"
        actionIcon={Plus}
      />

      {forms.length === 0 ? (
        <EmptyState
          icon={FormInput}
          title="No forms yet"
          description="Create your first form template for employee onboarding."
          action={handleCreate}
          actionLabel="Create Form"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FormInput className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(form)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(form)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800">{form.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{form.description || 'No description'}</p>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary" className="capitalize">
                      {form.form_type?.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {form.fields?.length || 0} fields
                    </Badge>
                    {!form.is_active && (
                      <Badge variant="secondary" className="bg-slate-200">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedForm ? 'Edit Form' : 'Create Form'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Form Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Personal Information Form"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Collect employee personal details..."
                />
              </div>
              <div className="space-y-2">
                <Label>Form Type</Label>
                <Select
                  value={formData.form_type}
                  onValueChange={(value) => setFormData({ ...formData, form_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg">Form Fields</Label>
                <Button onClick={addField} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {formData.fields.map((field, index) => {
                        const typeConfig = fieldTypeOptions.find(t => t.value === field.type);
                        const Icon = typeConfig?.icon || Type;
                        
                        return (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "p-4 bg-slate-50 rounded-xl border-2 border-transparent",
                                  snapshot.isDragging && "border-blue-500 shadow-lg"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div {...provided.dragHandleProps} className="mt-2 cursor-grab">
                                    <GripVertical className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Field label"
                                        value={field.label}
                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                      />
                                      <Select
                                        value={field.type}
                                        onValueChange={(value) => updateField(index, 'type', value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {fieldTypeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              <div className="flex items-center gap-2">
                                                <option.icon className="h-4 w-4" />
                                                {option.label}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <Input
                                        placeholder="Placeholder text"
                                        value={field.placeholder || ''}
                                        onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                                      />
                                      <div className="flex items-center gap-3 px-3 bg-white rounded-lg border">
                                        <Label className="text-sm">Required</Label>
                                        <Switch
                                          checked={field.required}
                                          onCheckedChange={(checked) => updateField(index, 'required', checked)}
                                        />
                                      </div>
                                    </div>
                                    {field.type === 'select' && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">Options (comma separated)</Label>
                                        <Input
                                          placeholder="Option 1, Option 2, Option 3"
                                          value={field.options?.join(', ') || ''}
                                          onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeField(index)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {formData.fields.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-500">
                  No fields added yet. Click "Add Field" to get started.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? 'Saving...' : 'Save Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}