'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Download, Loader2, FolderOpen, FileText } from 'lucide-react';

interface ExportHistory {
  id: string;
  type: string;
  quarter: string;
  format: string;
  createdAt: string;
  recordCount: number;
  filename: string;
}

export default function ExportPage() {
  const [selectedType, setSelectedType] = useState('achievements');
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ExportHistory[]>([]);

  // Persist history in localStorage so it survives navigation
  useEffect(() => {
    const saved = localStorage.getItem('export_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const saveHistory = (newEntry: ExportHistory) => {
    const updated = [newEntry, ...history].slice(0, 20); // keep last 20
    setHistory(updated);
    localStorage.setItem('export_history', JSON.stringify(updated));
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedType,
        quarter: selectedQuarter,
        format: selectedFormat,
      });

      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const match = contentDisposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : `export-${selectedType}-${Date.now()}.${selectedFormat}`;

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Estimate record count from CSV lines (subtract header)
      const text = await blob.text().catch(() => '');
      const lines = text.split('\n').filter(Boolean);
      const recordCount = Math.max(0, lines.length - 1);

      saveHistory({
        id: Date.now().toString(),
        type: selectedType,
        quarter: selectedQuarter,
        format: selectedFormat,
        createdAt: new Date().toLocaleString(),
        recordCount,
        filename,
      });

      toast.success(`Export downloaded — ${recordCount} records`);
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRedownload = (entry: ExportHistory) => {
    // Re-trigger download with same params
    const params = new URLSearchParams({
      type: entry.type,
      quarter: entry.quarter,
      format: entry.format,
    });
    window.open(`/api/export?${params}`, '_blank');
  };

  const TYPE_LABELS: Record<string, string> = {
    achievements: 'Employee Achievements',
    goals: 'Goals & Targets',
    checkins: 'Quarterly Check-ins',
    audit: 'Audit Logs',
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-950 leading-[32px]">Data Export</h1>
        <p className="text-[14px] text-zinc-500 mt-1">Generate raw data dumps for compliance, payroll, and reporting.</p>
      </div>

      {/* Export Options */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-zinc-900 mb-5">Generate Export</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Data Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-zinc-400 appearance-none"
            >
              <option value="achievements">Employee Achievements</option>
              <option value="goals">Goals & Targets</option>
              <option value="checkins">Quarterly Check-ins</option>
              <option value="audit">Audit Logs</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Quarter Filter</label>
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-zinc-400 appearance-none"
            >
              <option value="all">All Quarters</option>
              <option value="Q1">Q1 (Jul–Sep)</option>
              <option value="Q2">Q2 (Oct–Dec)</option>
              <option value="Q3">Q3 (Jan–Mar)</option>
              <option value="Q4">Q4 (Apr–Jun)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Format</label>
            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-zinc-400 appearance-none"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">CSV (Excel-compatible)</option>
            </select>
          </div>
        </div>

        {/* Preview what will be exported */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 mb-5 flex items-center gap-3">
          <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          <p className="text-[13px] text-zinc-600">
            Exporting <strong>{TYPE_LABELS[selectedType]}</strong>
            {selectedQuarter !== 'all' ? ` for ${selectedQuarter}` : ' for all quarters'}
            {' '}as <strong className="uppercase">{selectedFormat}</strong>
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-[14px] font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Download className="h-4 w-4" /> Download Export</>
          )}
        </button>
      </div>

      {/* Export History */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100">
          <h2 className="text-[15px] font-semibold text-zinc-900">Export History</h2>
          <p className="text-[13px] text-zinc-500 mt-0.5">Last 20 exports — stored locally in this browser</p>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <FolderOpen className="h-8 w-8 text-zinc-300" />
            <p className="text-[14px] text-zinc-400">No exports yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-3 px-5 text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-5 text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-5 text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Quarter</th>
                  <th className="text-left py-3 px-5 text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Format</th>
                  <th className="text-left py-3 px-5 text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Records</th>
                  <th className="text-left py-3 px-5 text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-5 text-[13px] text-zinc-600">{item.createdAt}</td>
                    <td className="py-3 px-5 text-[13px] text-zinc-900 capitalize font-medium">{TYPE_LABELS[item.type] || item.type}</td>
                    <td className="py-3 px-5 text-[13px] text-zinc-600">{item.quarter === 'all' ? 'All' : item.quarter}</td>
                    <td className="py-3 px-5">
                      <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono uppercase">{item.format}</span>
                    </td>
                    <td className="py-3 px-5 text-[13px] text-zinc-600 tabular-nums">{item.recordCount.toLocaleString()}</td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleRedownload(item)}
                        className="flex items-center gap-1 text-[13px] text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Re-download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}