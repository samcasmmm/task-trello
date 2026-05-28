'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
];

interface CustomField {
  id?: string;
  name: string;
  field_type: string;
  options?: any;
}

export default function CustomFieldsManager({
  projectId,
  customFields = [],
}: {
  projectId: string;
  customFields?: CustomField[];
}) {
  const [fields, setFields] = useState<CustomField[]>(customFields);
  const [loading, setLoading] = useState(false);
  const [newField, setNewField] = useState<CustomField>({
    name: '',
    field_type: 'text',
    options: null,
  });
  const [showForm, setShowForm] = useState(false);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newField.name.trim()) {
      toast.error('Field name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/api/projects/${projectId}/custom-fields`, {
        name: newField.name,
        fieldType: newField.field_type,
        options: newField.options,
      });
      const result = response.data;

      setFields([...fields, result]);
      setNewField({ name: '', field_type: 'text', options: null });
      setShowForm(false);
      toast.success('Custom field created!');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to create custom field';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Custom Fields</h2>
        <p className="text-gray-600">
          Add custom fields to extend task properties for your project
        </p>
      </div>

      {/* Fields list */}
      {fields.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{field.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      Type: {field.field_type.replace('_', ' ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">No custom fields yet</p>
            <p className="text-sm text-gray-500">
              Create custom fields to add additional properties to your tasks
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add field form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Custom Field</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddField} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Field Name</label>
                <Input
                  placeholder="e.g., Department, Budget, Client"
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Field Type</label>
                <Select
                  value={newField.field_type}
                  onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(newField.field_type === 'select' || newField.field_type === 'multiselect') && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Options (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g., Option1, Option2, Option3"
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        options: e.target.value
                          .split(',')
                          .map((o) => o.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Field'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setNewField({ name: '', field_type: 'text', options: null });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Field
        </Button>
      )}
    </div>
  );
}
