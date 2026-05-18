'use client';

import { useState } from 'react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { updateProfile } from '@/actions/users';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';

interface UsersClientPageProps {
  initialUsers: any[];
  departments: any[];
  managers: any[];
}

export default function UsersClientPage({ initialUsers, departments, managers }: UsersClientPageProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('employee');
  const [deptId, setDeptId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setRole(user.role || 'employee');
    setDeptId(user.department_id || '');
    setManagerId(user.manager_id || '');
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('role', role);
      if (deptId) formData.append('department_id', deptId);
      if (managerId) formData.append('manager_id', managerId);

      const res = await updateProfile(selectedUser.id, formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to update user profile');
      } else {
        toast.success('User profile updated successfully');
        // Optimistic state update
        setUsers(users.map(u => u.id === selectedUser.id ? { 
          ...u, 
          first_name: firstName, 
          last_name: lastName, 
          role, 
          department_id: deptId || null, 
          manager_id: managerId || null,
          departments: departments.find(d => d.id === deptId)
        } : u));
        closeEditModal();
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-section-gap p-6 relative">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">User Directory & Access Control</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Assign roles, set employee-manager reporting paths, and inspect system permissions.</p>
        </div>
        <button 
          onClick={() => toast.info('Registering new users is handled via Supabase Auth invitations.')}
          className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Register New User</span>
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-fade-in-up-stagger">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Employee Profile</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Assigned Role</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase">Department</th>
                <th className="px-4 py-3 font-section-label text-section-label text-zinc-500 tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u: any) => {
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;
                return (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-medium text-sm">
                          {getInitials(fullName)}
                        </div>
                        <div>
                          <div className="font-table-cell-primary text-table-cell-primary text-zinc-900">{fullName}</div>
                          <div className="font-caption text-caption text-zinc-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-900 text-white font-badge-label text-badge-label border border-zinc-900 capitalize">
                          {u.role}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 text-zinc-700 font-badge-label text-badge-label border border-zinc-200 capitalize">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-table-cell-primary text-table-cell-primary text-zinc-700">{u.departments?.name || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="text-zinc-500 hover:text-zinc-900 font-table-cell-primary text-table-cell-primary transition-colors bg-white border border-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                      >
                        Edit Roles
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-3 flex items-center justify-between">
          <span className="font-caption text-caption text-zinc-500">Showing {users.length} of {users.length} users</span>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-zoom-in">
            <button 
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-page-title text-page-title text-zinc-900 mb-2">Edit User Profile</h2>
            <p className="font-body-sm text-body-sm text-zinc-500 mb-6">Modify details and roles for {selectedUser.email}</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">First Name</label>
                  <input 
                    type="text" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)}
                    required
                    className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">System Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm bg-white focus:outline-none focus:border-zinc-900"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Department</label>
                <select 
                  value={deptId} 
                  onChange={e => setDeptId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm bg-white focus:outline-none focus:border-zinc-900"
                >
                  <option value="">No Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Reporting Manager</label>
                <select 
                  value={managerId} 
                  onChange={e => setManagerId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-md p-2.5 font-body-sm text-body-sm bg-white focus:outline-none focus:border-zinc-900"
                >
                  <option value="">No Manager (Top-level)</option>
                  {managers
                    .filter(m => m.id !== selectedUser.id) // Cannot report to self
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button 
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-zinc-200 rounded-md hover:bg-zinc-50 font-body-sm text-body-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-body-sm text-body-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
