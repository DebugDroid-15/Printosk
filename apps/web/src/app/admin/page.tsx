'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Printer,
  FileText,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Clock,
  Wifi,
  HardDrive,
  Users,
  Search,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface KioskRow {
  id: string;
  kiosk_code: string;
  kiosk_name: string;
  location: string;
  device_status: string;
  printer_status: string;
  printer_model: string;
  last_heartbeat: string | null;
}

interface PrintJobRow {
  id: string;
  job_id: string;
  total_pages: number;
  copies: number;
  amount_paise: number;
  status: string;
  kiosk_id: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState<'OVERVIEW' | 'KIOSKS' | 'JOBS' | 'LOGS'>('OVERVIEW');
  const [kiosks, setKiosks] = useState<KioskRow[]>([]);
  const [jobs, setJobs] = useState<PrintJobRow[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial live data from Supabase
  const fetchDashboardData = async () => {
    try {
      if (!isSupabaseConfigured) {
        // Fallback to sample data when offline or keys not configured
        setKiosks([
          {
            id: '1',
            kiosk_code: 'BBSR001',
            kiosk_name: 'Central Library Kiosk',
            location: 'Ground Floor, Central Library',
            device_status: 'ONLINE',
            printer_status: 'READY',
            printer_model: 'Epson EcoTank L3115',
            last_heartbeat: new Date().toISOString(),
          },
          {
            id: '2',
            kiosk_code: 'BBSR002',
            kiosk_name: 'Student Activity Center',
            location: '1st Floor, SAC Building',
            device_status: 'ONLINE',
            printer_status: 'READY',
            printer_model: 'Epson EcoTank L3115',
            last_heartbeat: new Date().toISOString(),
          },
        ]);
        setJobs([
          { id: '1', job_id: 'PSK-982014', total_pages: 2, copies: 1, amount_paise: 400, status: 'CLAIMED', kiosk_id: 'BBSR001', created_at: new Date().toISOString() },
          { id: '2', job_id: 'PSK-824691', total_pages: 5, copies: 1, amount_paise: 1000, status: 'COMPLETED', kiosk_id: 'BBSR001', created_at: new Date(Date.now() - 12 * 60000).toISOString() },
        ]);
        setLoading(false);
        return;
      }

      const { data: kiosksData } = await supabase.from('kiosks').select('*');
      if (kiosksData) setKiosks(kiosksData);

      const { data: jobsData } = await supabase.from('print_jobs').select('*').order('created_at', { ascending: false }).limit(20);
      if (jobsData) setJobs(jobsData);

      setIsLiveConnected(true);
    } catch (err) {
      console.error('Error fetching live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // 🔴 SUPABASE REALTIME SUBSCRIPTION
    // Automatically listens for hardware heartbeats, printer errors, and new paid jobs!
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('admin-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kiosks' },
          (payload) => {
            console.log('Realtime Kiosk Update received:', payload);
            fetchDashboardData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'print_jobs' },
          (payload) => {
            console.log('Realtime Job Update received:', payload);
            fetchDashboardData();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsLiveConnected(true);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Calculate live dynamic metrics from state
  const totalJobsCount = jobs.length;
  const completedJobsCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const activeKiosksCount = kiosks.filter((k) => k.device_status === 'ONLINE').length;
  const totalRevenuePaise = jobs
    .filter((j) => j.status === 'COMPLETED' || j.status === 'CLAIMED' || j.status === 'PRINTING')
    .reduce((sum, j) => sum + (j.amount_paise || 0), 0);
  const revenueInr = (totalRevenuePaise / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black">
              P2
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">Printosk Command Center</h1>
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">Admin & Fleet Operations</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            >
              Customer Site ↗
            </Link>
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isLiveConnected
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span>{isLiveConnected ? 'Realtime WebSocket Active 🟢' : 'Standalone Mode 🟡'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Metric Cards Grid - LIVE DYNAMIC VALUES */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Jobs</span>
              <FileText className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{totalJobsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{completedJobsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Live Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">₹{revenueInr}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Online Kiosks</span>
              <Printer className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{activeKiosksCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Speed</span>
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">~18s</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Auto Cleanup</span>
              <HardDrive className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-slate-900">60m</p>
          </div>
        </div>

        {/* Kiosk Fleet Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Physical Kiosks & Hardware Status</h2>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-bold bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-800 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {kiosks.map((kiosk) => (
              <div
                key={kiosk.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 ${
                  kiosk.device_status === 'ONLINE' ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 text-lg">{kiosk.kiosk_code}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          kiosk.device_status === 'ONLINE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {kiosk.device_status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{kiosk.kiosk_name}</p>
                    <p className="text-[11px] text-slate-400">{kiosk.location}</p>
                  </div>
                  <Link
                    href={`/kiosk/${kiosk.kiosk_code}`}
                    target="_blank"
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                    title="Open Kiosk Interface"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Printer Hardware:</span>
                    <span className="font-bold text-slate-900">{kiosk.printer_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Printer State:</span>
                    <span
                      className={`font-bold ${
                        kiosk.printer_status === 'READY'
                          ? 'text-emerald-600'
                          : kiosk.printer_status === 'PAPER_EMPTY'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {kiosk.printer_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Heartbeat:</span>
                    <span className="text-slate-400">
                      {kiosk.last_heartbeat ? new Date(kiosk.last_heartbeat).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Print Jobs Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Live Customer Print Jobs</h2>
            <div className="text-xs text-slate-400 font-medium">Realtime database events auto-reflected</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Pages & Copies</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{job.job_id}</td>
                    <td className="py-3 px-4">{job.total_pages} pages × {job.copies}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{((job.amount_paise || 0) / 100).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'CLAIMED'
                            ? 'bg-sky-100 text-sky-800'
                            : job.status === 'PRINTING'
                            ? 'bg-purple-100 text-purple-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(job.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
