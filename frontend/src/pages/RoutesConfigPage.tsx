import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Layers, CheckCircle2, GitBranch, ArrowRight } from 'lucide-react';

export const RoutesConfigPage: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const res = await api.get('/workflow-routes');
        setRoutes(res.data);
      } catch (err) {
        console.error('Failed to load routes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configurable Workflow Engine Routes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dynamic stage sequences, role-based transition policies, and version-locked application routing.
        </p>
      </div>

      <div className="space-y-4">
        {routes.map((route) => (
          <div key={route.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {route.route_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Version {route.version}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    ACTIVE
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{route.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{route.description}</p>
              </div>
            </div>

            {/* Stages Sequence Visualizer */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Ordered Lifecycle Stages & Permissions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {Object.entries(route.stages_config || {}).map(([stageKey, cfg]: [string, any]) => (
                  <div key={stageKey} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>{stageKey}</span>
                      <span className="text-[10px] text-blue-600 font-semibold">{cfg.deadline_days}d deadline</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{cfg.name}</div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      <b>Allowed Actions:</b> {cfg.allowed_actions?.join(', ') || 'Terminal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
