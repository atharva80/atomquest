import { createClient } from '@/lib/supabase/server';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

export const metadata = { title: 'User Management — Orbit' };

export default async function UsersPage() {
  const supabase = await createClient();
  
  // Fetch users with their departments
  const { data: users } = await supabase
    .from('profiles')
    .select('*, departments(name)')
    .order('first_name');

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-section-gap p-6">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-page-title text-page-title font-semibold text-zinc-900">User Directory & Access Control</h1>
          <p className="font-body-sm text-body-sm text-zinc-500">Assign roles, set employee-manager reporting paths, and inspect system permissions.</p>
        </div>
        <button className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md font-table-cell-primary text-table-cell-primary transition-colors flex items-center space-x-2">
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
              {users?.map((u: any) => {
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
                      <button className="text-zinc-500 hover:text-zinc-900 font-table-cell-primary text-table-cell-primary transition-colors bg-white border border-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm">
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
          <span className="font-caption text-caption text-zinc-500">Showing {users?.length || 0} of {users?.length || 0} users</span>
          <div className="flex space-x-2">
            <button className="p-1 rounded text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-1 rounded text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
