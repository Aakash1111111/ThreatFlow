import { useState } from 'react';
import { extractIOCs } from '../api/client';
import useStore from '../store/useStore';
import { Upload, FileText, Check, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InputModule = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [manualType, setManualType] = useState('ip');
  
  const [extractedData, setExtractedData] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceText, setSourceText] = useState('');
  
  const { submitIOCs } = useStore();
  const navigate = useNavigate();

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    setIsExtracting(true);
    setSourceText(inputText);
    try {
      const res = await extractIOCs(inputText);
      
      // Flatten results for table
      const list = [];
      res.results.ips.forEach(val => list.push({ id: Math.random().toString(), value: val, type: 'ip' }));
      res.results.domains.forEach(val => list.push({ id: Math.random().toString(), value: val, type: 'domain' }));
      res.results.urls.forEach(val => list.push({ id: Math.random().toString(), value: val, type: 'url' }));
      Object.entries(res.results.hashes).forEach(([type, arr]) => {
        arr.forEach(val => list.push({ id: Math.random().toString(), value: val, type: 'hash' }));
      });
      
      setExtractedData(list);
      // auto select all
      setSelectedItems(new Set(list.map(i => i.id)));
    } catch (e) {
      alert("Failed to extract: " + e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualValue.trim()) return;
    const newItem = { id: Math.random().toString(), value: manualValue.trim(), type: manualType };
    const currentList = extractedData || [];
    setExtractedData([newItem, ...currentList]);
    setSelectedItems(new Set([...selectedItems, newItem.id]));
    setManualValue('');
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedItems(newSet);
  };
  
  const removeRow = (id) => {
    setExtractedData(extractedData.filter(i => i.id !== id));
    const newSet = new Set(selectedItems);
    newSet.delete(id);
    setSelectedItems(newSet);
  };

  const handleSubmit = async () => {
    const itemsToSubmit = extractedData.filter(i => selectedItems.has(i.id)).map(i => ({
      value: i.value,
      ioc_type: i.type
    }));
    
    if (itemsToSubmit.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await submitIOCs(itemsToSubmit, sourceText);
      setExtractedData(null);
      setInputText('');
      navigate('/enrichment');
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'text' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-textSecondary hover:text-white'}`}
            onClick={() => setActiveTab('text')}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Raw Log Extraction
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-textSecondary hover:text-white'}`}
            onClick={() => setActiveTab('manual')}
          >
            <Plus className="inline-block w-4 h-4 mr-2" />
            Manual Entry
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'text' && (
            <div className="space-y-4">
              <textarea
                className="w-full h-48 bg-background border border-border rounded-lg p-4 text-textPrimary placeholder:text-textSecondary/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Paste logs, emails, or raw text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex justify-end">
                <button 
                  className="bg-primary hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center"
                  onClick={handleExtract}
                  disabled={isExtracting || !inputText.trim()}
                >
                  {isExtracting ? 'Extracting...' : <><Upload className="w-4 h-4 mr-2" /> Extract Artifacts</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="flex space-x-3">
              <select 
                className="bg-background border border-border text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase text-sm"
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
              >
                <option value="ip">IP</option>
                <option value="domain">Domain</option>
                <option value="url">URL</option>
                <option value="hash">Hash</option>
              </select>
              <input
                type="text"
                className="flex-1 bg-background border border-border text-white px-4 py-2.5 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter IOC value..."
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
              />
              <button 
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                onClick={handleManualAdd}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {extractedData && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-slate-800/80">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Check className="w-5 h-5 text-emerald-500 mr-2" />
              Staged Artifacts ({extractedData.length})
            </h3>
            <button 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedItems.size === 0}
              >
                {isSubmitting ? 'Saving...' : `Import ${selectedItems.size} Selected`}
            </button>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {extractedData.length === 0 ? (
               <div className="p-8 text-center text-textSecondary flex flex-col items-center">
                 <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                 <p>No artifacts generated yet</p>
               </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/50 text-textSecondary sticky top-0">
                  <tr>
                    <th className="px-6 py-3 w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.size === extractedData.length && extractedData.length > 0}
                        onChange={() => {
                          if (selectedItems.size === extractedData.length) setSelectedItems(new Set());
                          else setSelectedItems(new Set(extractedData.map(i => i.id)));
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary/50"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium">Value</th>
                    <th className="px-6 py-3 font-medium">Original Type</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {extractedData.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-700/20 transition-colors ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-6 py-4 text-white font-mono break-all">{item.value}</td>
                      <td className="px-6 py-4 text-textSecondary uppercase text-xs font-semibold tracking-wider">{item.type}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => removeRow(item.id)} className="text-slate-400 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InputModule;
