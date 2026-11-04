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

// Timeout threshold in seconds (if no heartbeat for 30s -> mark as OFFLINE)
const HEARTBEAT_TIMEOUT_SECONDS = 30;

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState<'OVERVIEW' | 'KIOSKS' | 'JOBS' | 'LOGS'>('OVERVIEW');
  const [kiosks, setKiosks] = useState<KioskRow[]>([]);
  const [jobs, setJobs] = useState<PrintJobRow[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update current time every 2 seconds to accurately calculate live offline status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live kiosks & jobs from Supabase
  const fetchDashboardData = async () => {
    try {
      if (!isSupabaseConfigured) {
        setKiosks([]);
        setJobs([]);
        setLoading(false);
        return;
      }

      const { data: kiosksData } = await supabase.from('kiosks').select('*').order('created_at', { ascending: true });
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

    // 🔴 SUPABASE REALTIME WEBSOCKET SUBSCRIPTION
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('admin-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kiosks' },
          (payload) => {
            fetchDashboardData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'print_jobs' },
          (payload) => {
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

  // Dynamically calculate whether each kiosk is ONLINE or OFFLINE based on last_heartbeat
  const evaluatedKiosks = kiosks.map((k) => {
    if (!k.last_heartbeat) {
      return { ...k, isLiveOnline: false, secondsAgo: 999 };
    }
    const lastSeenMs = new Date(k.last_heartbeat).getTime();
    const diffSeconds = Math.max(0, Math.floor((currentTime - lastSeenMs) / 1000));
    const isOnline = diffSeconds <= HEARTBEAT_TIMEOUT_SECONDS && k.device_status === 'ONLINE';

    return {
      ...k,
      isLiveOnline: isOnline,
      secondsAgo: diffSeconds,
    };
  });

  const onlineKiosksCount = evaluatedKiosks.filter((k) => k.isLiveOnline).length;
  const totalJobsCount = jobs.length;
  const completedJobsCount = jobs.filter((j) => j.status === 'COMPLETED').length;
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
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">Live Kiosk Fleet Operations</p>
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
              <span>{isLiveConnected ? 'Realtime WebSocket Active 🟢' : 'Connecting... 🟡'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Metric Cards Grid */}
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
              <span className="text-xs font-bold uppercase tracking-wider">Active Kiosks</span>
              <Printer className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{onlineKiosksCount} / {evaluatedKiosks.length}</p>
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

        {/* Physical Kiosks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Physical Kiosks & Hardware Telemetry</h2>
              <p className="text-xs text-slate-500 font-medium">Auto-registers new devices on boot & flags disconnected kiosks after 30s</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-bold bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-800 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {evaluatedKiosks.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Kiosks Registered Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Power on your ESP32-S3! It will automatically register itself in Supabase and appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {evaluatedKiosks.map((kiosk) => (
                <div
                  key={kiosk.id}
                  className={`bg-white border rounded-3xl p-6 shadow-sm space-y-4 transition-all ${
                    kiosk.isLiveOnline ? 'border-emerald-300 shadow-emerald-50' : 'border-rose-300 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-lg">{kiosk.kiosk_code}</span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            kiosk.isLiveOnline
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {kiosk.isLiveOnline ? 'ONLINE 🟢' : 'DISCONNECTED 🔴'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-1">{kiosk.kiosk_name}</p>
                      <p className="text-[11px] text-slate-400">{kiosk.location}</p>
                    </div>
                    <Link
                      href={`/kiosk/${kiosk.kiosk_code}`}
                      target="_blank"
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                      title="Open Kiosk Web Interface"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>Printer Model:</span>
                      <span className="font-bold text-slate-900">{kiosk.printer_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Printer State:</span>
                      <span
                        className={`font-bold ${
                          kiosk.printer_status === 'READY'
                            ? 'text-emerald-600'
                            : kiosk.printer_status === 'PRINTING'
                            ? 'text-purple-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {kiosk.printer_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heartbeat Status:</span>
                      <span className={kiosk.isLiveOnline ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                        {kiosk.secondsAgo <= 5
                          ? 'Just now (Active)'
                          : `${kiosk.secondsAgo}s ago`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No print jobs yet. Upload a document from the customer site to test!
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{job.job_id}</td>
                      <td className="py-3 px-4">{job.total_pages} pages × {job.copies}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{((job.amount_paise || 0) / 100).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
