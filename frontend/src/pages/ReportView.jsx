import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { generateReport } from '../api/client';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

const ReportView = () => {
  const { iocs, fetchIOCs } = useStore();
  const [title, setTitle] = useState('Threat Intelligence Executive Report');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [recentReports, setRecentReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('threatflow_reports') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchIOCs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    const idsToSubmit = selectedIds.size > 0 
      ? Array.from(selectedIds) 
      : iocs.map(i => i.id);

    if (idsToSubmit.length === 0) {
      alert("No artifacts to report on");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateReport(idsToSubmit, title);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ThreatFlow_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      const newReport = { id: Date.now(), title, date: new Date().toISOString(), count: idsToSubmit.length };
      const newReportsList = [newReport, ...recentReports].slice(0, 10);
      setRecentReports(newReportsList);
      localStorage.setItem('threatflow_reports', JSON.stringify(newReportsList));
      
    } catch (e) {
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleIoc = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Config Panel */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white flex items-center mb-6">
            <FileText className="w-5 h-5 mr-3 text-primary" />
            Report Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Report Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <hr className="my-8 border-border" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-textSecondary">Target Artifacts ({iocs.length} available)</label>
              <button 
                className="text-xs text-primary hover:text-indigo-400"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </button>
            </div>
            
            <div className="bg-background border border-border rounded-lg max-h-64 overflow-y-auto">
              {iocs.map(ioc => (
                <div key={ioc.id} className="flex items-center px-4 py-3 border-b border-border/50 hover:bg-slate-800/30">
                  <input 
                    type="checkbox" 
                    id={`ioc-${ioc.id}`}
                    checked={selectedIds.has(ioc.id) || selectedIds.size === 0}
                    onChange={() => {
                      if (selectedIds.size === 0) {
                        // If empty, it means "All" were virtually selected. Now we explicitly select everything EXCEPT this one.
                        const newSet = new Set(iocs.map(i => i.id));
                        newSet.delete(ioc.id);
                        setSelectedIds(newSet);
                      } else {
                        toggleIoc(ioc.id);
                      }
                    }}
                    className="rounded border-slate-600 bg-slate-700 text-primary"
                  />
                  <label htmlFor={`ioc-${ioc.id}`} className="ml-3 flex-1 flex justify-between items-center cursor-pointer">
                    <span className="font-mono text-sm text-slate-300">{ioc.value}</span>
                    <span className="text-xs uppercase text-slate-500">{ioc.ioc_type}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-textSecondary mt-2">
              {selectedIds.size === 0 ? "All items will be included by default." : `${selectedIds.size} items selected.`}
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border flex justify-end">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-indigo-600 px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-primary/20 transition-all flex items-center disabled:opacity-50"
            >
              <Download className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating Document..." : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>
      
      {/* History panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm h-full max-h-[800px] overflow-y-auto">
          <h3 className="text-base font-semibold text-white mb-4">Export History</h3>
          
          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map(report => (
                <div key={report.id} className="p-4 bg-background border border-border rounded-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
                  <h4 className="text-sm font-medium text-slate-200 truncate pr-4" title={report.title}>{report.title}</h4>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="text-textSecondary">{new Date(report.date).toLocaleDateString()}</span>
                    <span className="flex items-center text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {report.count} items
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-textSecondary text-center py-8">No prior reports generated on this device.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
