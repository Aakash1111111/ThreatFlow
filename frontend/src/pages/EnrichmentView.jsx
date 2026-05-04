import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Database, ChevronDown, ChevronRight, FileDown, Trash2 } from 'lucide-react';
import { getEnrichmentResults } from '../api/client';

const EnrichmentView = () => {
  const { iocs, loading, fetchIOCs, enrichIOC, enrichBulk, selectedIocs, toggleSelectIOC, selectAllIOCs, clearSelection, deleteIOC, bulkDeleteIOCs } = useStore();
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [search, setSearch] = useState('');
  
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [enrichmentDataCache, setEnrichmentDataCache] = useState({});
  const [enrichingIds, setEnrichingIds] = useState(new Set());

  useEffect(() => {
    fetchIOCs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredIocs = iocs.filter((ioc) => {
    if (filterType !== 'all' && ioc.ioc_type !== filterType) return false;
    if (filterRisk !== 'all' && ioc.risk_level !== filterRisk) return false;
    if (search && !ioc.value.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleRow = async (id) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      if (!enrichmentDataCache[id]) {
        try {
          const results = await getEnrichmentResults(id);
          setEnrichmentDataCache(prev => ({ ...prev, [id]: results }));
        } catch (e) {
          console.error("Failed to load details for", id, e);
        }
      }
    }
    setExpandedRows(newSet);
  };

  const handleEnrichSingle = async (id, e) => {
    e.stopPropagation();
    setEnrichingIds(prev => new Set([...prev, id]));
    try {
      await enrichIOC(id);
      const results = await getEnrichmentResults(id);
      setEnrichmentDataCache(prev => ({ ...prev, [id]: results }));
    } catch (e) {
      alert("Failed to enrich: " + e.message);
    } finally {
      const newSet = new Set(enrichingIds);
      newSet.delete(id);
      setEnrichingIds(newSet);
    }
  };

  const handleEnrichBulk = async () => {
    if (selectedIocs.length === 0) return;
    const ids = [...selectedIocs];
    ids.forEach(id => setEnrichingIds(prev => new Set([...prev, id])));
    try {
      await enrichBulk(ids);
      clearSelection();
    } catch (e) {
      alert("Bulk enrichment failed: " + e.message);
    } finally {
      setEnrichingIds(prev => {
        const newSet = new Set(prev);
        ids.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIocs.length === 0) return;
    if (!confirm(`Delete ${selectedIocs.length} selected items?`)) return;
    try {
      // Mocking bulk delete logic by using loop, or API if bulk exists. 
      // Store doesn't have bulkDelete wrapper so just clear locally after API.
      for (const id of selectedIocs) {
          await deleteIOC(id); // assuming deleteIOC exists in api
      }
      clearSelection();
      fetchIOCs();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Artifacts Database</h2>
        
        {/* Filters */}
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary" />
            <input 
              type="text" 
              placeholder="Search value..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select 
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="ip">IP</option>
            <option value="domain">Domain</option>
            <option value="url">URL</option>
            <option value="hash">Hash</option>
          </select>
          <select 
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="all">All Risks</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="clean">Clean</option>
          </select>
        </div>
      </div>

      {selectedIocs.length > 0 && (
        <div className="bg-primary/20 border border-primary/30 text-white px-4 py-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-4">
          <span className="font-medium text-primary-light">{selectedIocs.length} artifacts selected</span>
          <div className="flex space-x-3">
            <button onClick={handleEnrichBulk} className="flex items-center text-sm bg-primary hover:bg-indigo-600 px-3 py-1.5 rounded transition-colors shadow-lg shadow-primary/20">
              <Database className="w-4 h-4 mr-2" /> Enrich Selected
            </button>
            <button onClick={handleDeleteBulk} className="flex items-center text-sm bg-risk-critical/20 hover:bg-risk-critical/40 text-risk-critical px-3 py-1.5 rounded transition-colors">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching artifacts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-textSecondary uppercase text-xs tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      onClick={(e) => e.stopPropagation()}
                      checked={selectedIocs.length === filteredIocs.length && filteredIocs.length > 0}
                      onChange={() => {
                        if (selectedIocs.length === filteredIocs.length) clearSelection();
                        else selectAllIOCs(filteredIocs.map(i => i.id));
                      }}
                      className="rounded border-slate-600 bg-slate-700 text-primary"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Value</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Risk Level</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIocs.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-textSecondary">No artifacts found</td></tr>
                ) : (
                  filteredIocs.map((ioc) => (
                    <React.Fragment key={ioc.id}>
                      <tr 
                        className={`hover:bg-slate-700/20 transition-colors cursor-pointer ${expandedRows.has(ioc.id) ? 'bg-slate-800/50' : ''}`}
                        onClick={() => toggleRow(ioc.id)}
                      >
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                           <input 
                            type="checkbox" 
                            checked={selectedIocs.includes(ioc.id)}
                            onChange={() => toggleSelectIOC(ioc.id)}
                            className="rounded border-slate-600 bg-slate-700 text-primary"
                          />
                        </td>
                        <td className="px-6 py-4 text-white font-mono break-all flex items-center">
                          {expandedRows.has(ioc.id) ? <ChevronDown className="w-4 h-4 mr-2 text-textSecondary" /> : <ChevronRight className="w-4 h-4 mr-2 text-textSecondary" />}
                          {ioc.value}
                        </td>
                        <td className="px-6 py-4 text-textSecondary uppercase text-xs tracking-wider">{ioc.ioc_type}</td>
                        <td className="px-6 py-4">
                           <RiskBadge level={ioc.risk_level} score={ioc.risk_score} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            disabled={enrichingIds.has(ioc.id)}
                            onClick={(e) => handleEnrichSingle(ioc.id, e)}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {enrichingIds.has(ioc.id) ? 'Running...' : 'Update Context'}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(ioc.id) && (
                        <tr className="bg-slate-900 border-b border-border pl-12 pr-6 py-4">
                          <td colSpan="5" className="p-0">
                            <div className="bg-slate-900 p-6 shadow-inner border-y border-border/50">
                              <h4 className="text-xs font-semibold text-textSecondary tracking-wider uppercase mb-3">Enrichment Findings</h4>
                              {enrichmentDataCache[ioc.id] ? (
                                enrichmentDataCache[ioc.id].length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {enrichmentDataCache[ioc.id].map(res => (
                                      <div key={res.id} className="bg-card border border-border p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-white font-medium capitalize">{res.source}</span>
                                          <span className="text-xs text-textSecondary">{new Date(res.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                                          <pre>{JSON.stringify(res.raw_response, null, 2)}</pre>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-textSecondary italic">No enrichment results yet.</p>
                                )
                              ) : (
                                <p className="text-sm text-textSecondary animate-pulse">Loading context...</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Required wrapper to avoid redefining React inline
import React from 'react';
export default EnrichmentView;
