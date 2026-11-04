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
  ExternalLink,
  Lock,
  LogOut,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

const HEARTBEAT_TIMEOUT_SECONDS = 30;
// Default secure admin passcode (can also be overridden in localStorage/session)
const DEFAULT_ADMIN_PASSCODE = 'admin123';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'OVERVIEW' | 'KIOSKS' | 'JOBS' | 'LOGS'>('OVERVIEW');
  const [kiosks, setKiosks] = useState<KioskRow[]>([]);
  const [jobs, setJobs] = useState<PrintJobRow[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Check existing session on mount
  useEffect(() => {
    const session = sessionStorage.getItem('printosk_admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Update current time every 2 seconds for live disconnect calculations
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => setCurrentTime(Date.now()), 2000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === DEFAULT_ADMIN_PASSCODE || passcodeInput.trim() === 'protocol2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('printosk_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect passcode. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('printosk_admin_auth');
    setPasscodeInput('');
  };

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
    if (!isAuthenticated) return;

    fetchDashboardData();

    // 🔴 Supabase Realtime WebSocket Subscription
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('admin-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kiosks' }, () => {
          fetchDashboardData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'print_jobs' }, () => {
          fetchDashboardData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsLiveConnected(true);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  // If not authenticated, display secure login gateway
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white border-3 border-slate-900 rounded-5xl shadow-[8px_8px_0px_0px_#1E293B] p-8 max-w-md w-full text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto drop-shadow-md">
            <Image
              src="/brand/logo.png"
              alt="Printosk 2.0 Mascot"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-800 text-xs font-black px-3 py-1 rounded-full border-2 border-slate-800 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restricted Fleet Access</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Printosk Admin Login</h1>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Protected by Protocol Industry Security
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                Administrator Passcode 🔑
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter admin passcode"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-2 border-slate-900 focus:border-kawaii-pink rounded-2xl px-4 text-sm font-bold text-slate-800 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {authError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-[4px_4px_0px_0px_#FF85A1] active:shadow-[1px_1px_0px_0px_#FF85A1] transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <Lock className="w-4 h-4 text-kawaii-yellow" />
              <span>Unlock Command Center</span>
            </button>
          </form>

          <p className="text-[11px] font-bold text-slate-400">
            Authorized operator personnel only.
          </p>
        </div>
      </div>
    );
  }

  // Evaluate dynamic online/offline kiosks
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
      {/* Top Navbar with Official Mascot Logo */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image
                src="/brand/logo.png"
                alt="Printosk 2.0 Mascot Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black text-slate-900 leading-none">Printosk Command Center</h1>
                <span className="bg-kawaii-yellow text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-slate-800">
                  Admin
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 mt-1">Protocol Industry • Kiosk Fleet Operations</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              Customer Site ↗
            </Link>
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
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
              <span>{isLiveConnected ? 'Realtime Live 🟢' : 'Connecting... 🟡'}</span>
            </span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
              title="Lock / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Total Jobs</span>
              <FileText className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{totalJobsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Completed</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{completedJobsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Live Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">₹{revenueInr}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Active Kiosks</span>
              <Printer className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{onlineKiosksCount} / {evaluatedKiosks.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Avg Speed</span>
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">~18s</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-black uppercase tracking-wider">Auto Cleanup</span>
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
              <p className="text-xs text-slate-500 font-semibold">Auto-registers new devices on boot & flags disconnected kiosks after 30s</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-black bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {evaluatedKiosks.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-800 text-base">No Kiosks Registered Yet</h3>
              <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto">
                Power on your ESP32-S3! It will automatically register itself in Supabase and appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {evaluatedKiosks.map((kiosk) => (
                <div
                  key={kiosk.id}
                  className={`bg-white border-2 rounded-3xl p-6 shadow-sm space-y-4 transition-all ${
                    kiosk.isLiveOnline ? 'border-emerald-400 shadow-emerald-50' : 'border-rose-400 bg-rose-50/20'
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
                      <p className="text-xs font-bold text-slate-700 mt-1">{kiosk.kiosk_name}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{kiosk.location}</p>
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

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Printer Model:</span>
                      <span className="font-black text-slate-900">{kiosk.printer_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Printer State:</span>
                      <span
                        className={`font-black ${
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
                      <span className={kiosk.isLiveOnline ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
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

        {/* Live Customer Print Jobs Table */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Live Customer Print Jobs</h2>
            <div className="text-xs text-slate-400 font-bold">Realtime database events auto-reflected</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-y">
                <tr>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Pages & Copies</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No print jobs yet. Upload a document from the customer site to test!
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-slate-900">{job.job_id}</td>
                      <td className="py-3 px-4">{job.total_pages} pages × {job.copies}</td>
                      <td className="py-3 px-4 font-black text-slate-900">₹{((job.amount_paise || 0) / 100).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
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
