import React, { useState, useEffect } from 'react';
import * as Entities from '@/api/entities';
import * as Integrations from '@/api/integrations';
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
  FileSignature, Plus, Edit, Trash2, Upload, Eye,
  ArrowRight, Search, Replace
} from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import { motion } from 'framer-motion';

const systemVariables = [
  { value: 'employee_name', label: 'Employee Full Name' },
  { value: 'employee_email', label: 'Employee Email' },
  { value: 'employee_position', label: 'Position/Title' },
  { value: 'employee_department', label: 'Department' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'current_date', label: 'Current Date' },
  { value: 'company_name', label: 'Company Name' },
  { value: 'hr_name', label: 'HR Manager Name' }
];

export default function AdminDocumentTemplates() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_file_url: '',
    placeholders: [],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const templatesData = await Entities.DocumentTemplate.list();
      setTemplates(templatesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template_file_url: template.template_file_url || '',
      placeholders: template.placeholders || [],
      is_active: template.is_active !== false
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      template_file_url: '',
      placeholders: [],
      is_active: true
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setSubmitting(true);
    try {
      if (selectedTemplate) {
        await Entities.DocumentTemplate.update(selectedTemplate.id, formData);
      } else {
        await Entities.DocumentTemplate.create(formData);
      }

      await loadData();
      setEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await Entities.DocumentTemplate.delete(template.id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await Integrations.UploadFile({ file });
      setFormData({ ...formData, template_file_url: file_url });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const addPlaceholder = () => {
    const newPlaceholder = {
      find: '',
      replace_with: '',
      type: 'system'
    };
    setFormData({
      ...formData,
      placeholders: [...formData.placeholders, newPlaceholder]
    });
  };

  const updatePlaceholder = (index, key, value) => {
    const newPlaceholders = [...formData.placeholders];
    newPlaceholders[index] = { ...newPlaceholders[index], [key]: value };
    setFormData({ ...formData, placeholders: newPlaceholders });
  };

  const removePlaceholder = (index) => {
    const newPlaceholders = formData.placeholders.filter((_, i) => i !== index);
    setFormData({ ...formData, placeholders: newPlaceholders });
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
        title="Document Templates"
        description="Create customizable document templates with placeholders"
        action={handleCreate}
        actionLabel="Create Template"
        actionIcon={Plus}
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No templates yet"
          description="Create document templates with dynamic placeholders for personalized documents."
          action={handleCreate}
          actionLabel="Create Template"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <FileSignature className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex gap-1">
                      {template.template_file_url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(template.template_file_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800">{template.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{template.description || 'No description'}</p>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline">
                      {template.placeholders?.length || 0} placeholders
                    </Badge>
                    {template.template_file_url && (
                      <Badge className="bg-emerald-100 text-emerald-700">Has Template</Badge>
                    )}
                    {!template.is_active && (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Document Template' : 'Create Document Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left Side - Template Preview */}
            <div className="space-y-4">
              <Label className="text-lg">Template File</Label>
              
              <div 
                className="border-2 border-dashed rounded-xl p-6 text-center hover:border-amber-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('template-file').click()}
              >
                <input
                  id="template-file"
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
                {uploading ? (
                  <p className="text-slate-500">Uploading...</p>
                ) : formData.template_file_url ? (
                  <div className="space-y-2">
                    <FileSignature className="h-12 w-12 text-amber-500 mx-auto" />
                    <p className="text-sm text-slate-600">Template uploaded</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(formData.template_file_url, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">Click to upload PDF template</p>
                    <p className="text-sm text-slate-400 mt-1">PDF files only</p>
                  </>
                )}
              </div>

              {formData.template_file_url && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <iframe
                    src={formData.template_file_url}
                    className="w-full h-64 rounded-lg border"
                    title="Template Preview"
                  />
                </div>
              )}
            </div>

            {/* Right Side - Form & Placeholders */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Onboarding Certificate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Certificate issued upon completing onboarding..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              {/* Placeholders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Find & Replace Placeholders</Label>
                  <Button onClick={addPlaceholder} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {formData.placeholders.map((placeholder, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Find text (e.g., {{EMPLOYEE_NAME}})"
                          value={placeholder.find}
                          onChange={(e) => updatePlaceholder(index, 'find', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <Select
                          value={placeholder.type}
                          onValueChange={(value) => updatePlaceholder(index, 'type', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        {placeholder.type === 'system' ? (
                          <Select
                            value={placeholder.replace_with}
                            onValueChange={(value) => updatePlaceholder(index, 'replace_with', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select variable" />
                            </SelectTrigger>
                            <SelectContent>
                              {systemVariables.map((variable) => (
                                <SelectItem key={variable.value} value={variable.value}>
                                  {variable.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Replace with..."
                            value={placeholder.replace_with}
                            onChange={(e) => updatePlaceholder(index, 'replace_with', e.target.value)}
                            className="flex-1"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlaceholder(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {formData.placeholders.length === 0 && (
                    <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-500 text-sm">
                      Add placeholders to define find & replace pairs
                    </div>
                  )}
                </div>
              </div>
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
              {submitting ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}