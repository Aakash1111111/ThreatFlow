import { useEffect } from 'react';
import useStore from '../store/useStore';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, AlertTriangle, Database, Activity } from 'lucide-react';

const COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
  clean: '#94A3B8'
};

const Dashboard = () => {
  const { stats, timeline, fetchStats } = useStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!stats) return <LoadingSpinner text="Loading dashboard analytics..." />;

  const pieData = Object.entries(stats.by_risk_level || {}).map(([key, value]) => ({
    name: key.toUpperCase(),
    value,
    color: COLORS[key] || COLORS.clean
  })).filter(item => item.value > 0);

  const criticalHighCount = (stats.by_risk_level?.critical || 0) + (stats.by_risk_level?.high || 0);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textSecondary text-sm font-medium">Total IOCs</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total_iocs}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg"><Target className="w-5 h-5 text-primary" /></div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textSecondary text-sm font-medium">Critical / High</p>
              <h3 className="text-2xl font-bold text-risk-critical mt-1">{criticalHighCount}</h3>
            </div>
            <div className="p-3 bg-risk-critical/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-risk-critical" /></div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textSecondary text-sm font-medium">Enrichment Coverage</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.enrichment_coverage}%</h3>
            </div>
            <div className="p-3 bg-risk-low/10 rounded-lg"><Database className="w-5 h-5 text-risk-low" /></div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-textSecondary text-sm font-medium">Avg Risk Score</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.avg_risk_score}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg"><Activity className="w-5 h-5 text-emerald-500" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-textSecondary text-sm">No risk data available</div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Ingestion Timeline (30 Days)</h3>
          <div className="h-64">
            {timeline && timeline.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-textSecondary text-sm">No activity recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent IOCs */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Recent Artifacts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/50 text-textSecondary">
              <tr>
                <th className="px-6 py-3 font-medium">Value</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Risk Level</th>
                <th className="px-6 py-3 font-medium">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recent_iocs?.length > 0 ? (
                stats.recent_iocs.map((ioc) => (
                  <tr key={ioc.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 text-white font-mono">{ioc.value}</td>
                    <td className="px-6 py-4 text-textSecondary uppercase text-xs tracking-wider">{ioc.type}</td>
                    <td className="px-6 py-4"><RiskBadge level={ioc.risk_level} /></td>
                    <td className="px-6 py-4 text-textSecondary">{new Date(ioc.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-textSecondary">No recent artifacts</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
