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
import { Badge } from '@/components/ui/badge';
import { Plus, Mail } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access and control' },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage team and projects',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Can create and edit tasks',
  },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

interface TeamMember {
  id?: string;
  user_id: string;
  role: string;
  joined_at?: string;
  users?: {
    id: string;
    email: string;
    fullName: string;
    avatar_url?: string;
  };
}

export default function TeamMembersManager({
  tenantId,
  members = [],
}: {
  tenantId: string;
  members?: TeamMember[];
}) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(members);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showForm, setShowForm] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!response.ok) throw new Error('Failed to invite user');
      const result = await response.json();
      setTeamMembers([...teamMembers, result]);
      setInviteEmail('');
      setInviteRole('member');
      setShowForm(false);
      toast.success(`Invited ${inviteEmail} as ${inviteRole}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Team Members</h2>
        <p className='text-gray-600'>
          Manage who can access this workspace and their permissions
        </p>
      </div>

      {/* Members list */}
      {teamMembers.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Members ({teamMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {teamMembers.map((member) => (
                <div
                  key={member.id || member.user_id}
                  className='flex items-center justify-between p-4 rounded-lg bg-gray-50'
                >
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>
                      {member.users?.fullName || 'Unknown'}
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {member.users?.email}
                    </p>
                  </div>
                  <Badge className={`capitalize ${ROLE_COLORS[member.role]}`}>
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='py-8 text-center'>
            <p className='text-gray-600 mb-4'>No team members yet</p>
            <p className='text-sm text-gray-500'>
              Invite team members to collaborate on this workspace
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invite form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Invite Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-900 mb-1'>
                  Email Address
                </label>
                <Input
                  type='email'
                  placeholder='colleague@example.com'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className='text-xs text-gray-600 mt-1'>
                  The user must have already signed up for an account
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-900 mb-1'>
                  Role
                </label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className='font-medium'>{role.label}</div>
                          <div className='text-xs text-gray-600'>
                            {role.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex gap-2 pt-4'>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Sending invite...' : 'Send Invite'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setShowForm(false);
                    setInviteEmail('');
                    setInviteRole('member');
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
          <Plus className='w-4 h-4 mr-2' />
          <Mail className='w-4 h-4 mr-2' />
          Invite Member
        </Button>
      )}

      {/* Role descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {ROLES.map((role) => (
              <div key={role.value} className='pb-3 border-b last:border-b-0'>
                <h5 className='font-medium text-gray-900 capitalize'>
                  {role.label}
                </h5>
                <p className='text-sm text-gray-600'>{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
