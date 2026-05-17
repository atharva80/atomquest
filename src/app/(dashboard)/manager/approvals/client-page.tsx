'use client';

import { useState } from 'react';
import { Goal, Profile } from '@/types';
import { EmptyState } from '@/components/shared/empty-state';
import { FileCheck } from 'lucide-react';

interface ApprovalRequest {
  profile: Profile;
  goals: Goal[];
  submittedAt: string;
}

interface ApprovalsClientPageProps {
  approvalRequests: ApprovalRequest[];
}

export default function ApprovalsClientPage({ approvalRequests }: ApprovalsClientPageProps) {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(approvalRequests.length > 0 ? approvalRequests[0] : null);

  if (approvalRequests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goal Approvals</h1>
          <p className="text-slate-500">Review and approve goal sheets submitted by your team</p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileCheck className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">All caught up!</h3>
          <p className="text-slate-500 mt-1 text-center max-w-sm">
            There are no pending goal sheets requiring your approval at the moment.
          </p>
        </div>
      </div>
    );
  }

  const totalWeightage = selectedRequest?.goals.reduce((sum, g) => sum + g.weightage, 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-section-gap">
        <h2 className="font-page-title text-page-title text-zinc-900 mb-2">Pending Approvals</h2>
        <p className="font-body-sm text-body-sm text-zinc-500">Review and approve team goal sheets for the current cycle.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-section-gap items-start">
        {/* Approvals List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {approvalRequests.map((req, index) => (
            <div
              key={req.profile.id}
              className={`bg-white border rounded-xl p-card-padding cursor-pointer animate-slide-up ${
                selectedRequest?.profile.id === req.profile.id
                  ? 'border-2 border-zinc-900'
                  : 'border-zinc-200 hover:border-zinc-400 transition-colors'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    alt={req.profile.first_name}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                    src={`https://ui-avatars.com/api/?name=${req.profile.first_name}+${req.profile.last_name}`}
                  />
                  <div>
                    <h3 className="font-table-cell-primary text-table-cell-primary text-zinc-900">
                      {req.profile.first_name} {req.profile.last_name}
                    </h3>
                    <p className="font-caption text-caption text-zinc-500">{req.profile.department_id}</p>
                  </div>
                </div>
                <span className="font-caption text-caption text-zinc-500">
                  {new Date(req.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-100">
                <div>
                  <p className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest mb-1">
                    Goals
                  </p>
                  <p className="font-data-value-lg text-data-value-lg text-zinc-900 tabular-nums">{req.goals.length}</p>
                </div>
                <div>
                  <p className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest mb-1">
                    Weightage
                  </p>
                  <p className="font-data-value-lg text-data-value-lg text-zinc-900 tabular-nums">
                    {req.goals.reduce((sum, g) => sum + g.weightage, 0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Detail View (Expanded) */}
        {selectedRequest && (
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl flex flex-col h-[calc(100vh-200px)] sticky top-24">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 animate-slide-right">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-section-heading text-section-heading text-zinc-900">Goal Sheet Details</h3>
                <div className="bg-zinc-100 px-2 py-1 rounded-full flex items-center gap-1.5 border border-zinc-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-progress-mid animate-pulse-slow"></div>
                  <span className="font-badge-label text-badge-label text-zinc-700">Pending Review</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  alt={selectedRequest.profile.first_name}
                  className="w-12 h-12 rounded-full object-cover border border-zinc-200"
                  src={`https://ui-avatars.com/api/?name=${selectedRequest.profile.first_name}+${selectedRequest.profile.last_name}`}
                />
                <div>
                  <h2 className="font-page-title text-page-title text-zinc-900">
                    {selectedRequest.profile.first_name} {selectedRequest.profile.last_name}
                  </h2>
                  <p className="font-body-sm text-body-sm text-zinc-500">
                    Submitted on {new Date(selectedRequest.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            {/* Scrollable Goals List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-50/50 animate-slide-right">
              {selectedRequest.goals.map((goal) => (
                <div key={goal.id} className="bg-white border border-zinc-200 rounded-md p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-table-cell-primary text-table-cell-primary text-zinc-900 flex-1 pr-4">
                      {goal.title}
                    </h4>
                    <span className="font-badge-label text-badge-label text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 tabular-nums">
                      {goal.weightage}%
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-zinc-500 mb-4">{goal.description}</p>
                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
                    <div>
                      <p className="font-caption text-caption text-zinc-500 mb-1">Key Result 1</p>
                      <p className="font-body-sm text-body-sm text-zinc-900">{goal.uom_type?.replace("_", " ") || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-caption text-caption text-zinc-500 mb-1">Due Date</p>
                      <p className="font-body-sm text-body-sm text-zinc-900">{goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3 rounded-b-xl animate-slide-right">
              <button className="px-4 py-2 border border-zinc-200 rounded-md bg-white text-error font-table-cell-primary text-table-cell-primary hover:bg-zinc-50 transition-colors">
                Return for Edits
              </button>
              <button className="px-4 py-2 bg-zinc-900 text-white rounded-md font-table-cell-primary text-table-cell-primary hover:bg-zinc-800 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check</span>
                Approve Goals
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
