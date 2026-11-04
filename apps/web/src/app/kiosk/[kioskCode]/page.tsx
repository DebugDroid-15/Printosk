'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, CheckCircle, Sparkles, AlertTriangle, Loader2, Heart, ArrowRight } from 'lucide-react';

export default function KioskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const kioskCode = (params.kioskCode as string) || 'BBSR001';
  const prefill = searchParams.get('prefill') || '';

  const [jobIdInput, setJobIdInput] = useState(prefill);
  const [status, setStatus] = useState<'IDLE' | 'VALIDATING' | 'PRINTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  // Keypad click handler
  const handleNumClick = (val: string) => {
    if (jobIdInput.length < 12) {
      setJobIdInput((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setJobIdInput((prev) => prev.slice(0, -1));
  };

  const handleStartPrinting = async () => {
    if (!jobIdInput.trim()) return;
    setStatus('VALIDATING');
    setErrorMessage('');

    try {
      // Direct call to atomic job claim API
      const res = await fetch('/api/kiosk/claim-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kioskCode,
          jobId: jobIdInput.startsWith('PSK-') ? jobIdInput : `PSK-${jobIdInput}`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Job validation failed');
      }

      setStatus('PRINTING');
      // Simulate real-time printer output progression
      await new Promise((res) => setTimeout(res, 3000));
      setStatus('SUCCESS');
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMessage(err.message || 'Job expired or already collected!');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Kiosk Cute Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-kawaii-mint-light border-2 border-slate-900 text-teal-800 px-4 py-1 rounded-full text-xs font-black mb-3 shadow-[2px_2px_0px_0px_#1E293B]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Kiosk Connected & Warm! 🖨️</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center space-x-2">
          <span>Kiosk {kioskCode}</span>
          <span className="text-xl">🌸</span>
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-0.5">Central Campus Library • Station #1</p>
      </div>

      {/* Main Touch Card */}
      <div className="bg-white border-3 border-slate-900 rounded-5xl shadow-[8px_8px_0px_0px_#BDB2FF] p-6 space-y-6">
        {status === 'IDLE' && (
          <>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 text-center">
                Enter Your Secret Job ID 🎀
              </label>
              <div className="h-16 bg-kawaii-cream border-3 border-slate-900 focus-within:border-kawaii-pink rounded-3xl flex items-center justify-center px-4 transition-all shadow-[3px_3px_0px_0px_#1E293B]">
                <span className="text-2xl font-mono font-black tracking-widest text-slate-900">
                  {jobIdInput || <span className="text-slate-300">PSK-______</span>}
                </span>
              </div>
            </div>

            {/* Mobile Touch Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumClick(digit)}
                  className="h-14 bg-kawaii-yellow-light/60 hover:bg-kawaii-yellow text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-2xl transition-all shadow-[3px_3px_0px_0px_#1E293B] active:shadow-[1px_1px_0px_0px_#1E293B]"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => handleNumClick('0')}
                className="col-start-2 h-14 bg-kawaii-yellow-light/60 hover:bg-kawaii-yellow text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-2xl transition-all shadow-[3px_3px_0px_0px_#1E293B] active:shadow-[1px_1px_0px_0px_#1E293B]"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-slate-900 rounded-2xl font-black text-xs transition-all flex items-center justify-center shadow-[3px_3px_0px_0px_#1E293B] active:shadow-[1px_1px_0px_0px_#1E293B]"
              >
                DEL ⌫
              </button>
            </div>

            <button
              onClick={handleStartPrinting}
              disabled={jobIdInput.length < 3}
              className="w-full bg-kawaii-pink hover:bg-kawaii-pink-dark disabled:opacity-50 text-white font-black py-4 rounded-3xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#1E293B] active:shadow-[1px_1px_0px_0px_#1E293B] transition-all flex items-center justify-center space-x-2 text-base"
            >
              <Printer className="w-5 h-5" />
              <span>Start Printing Now! 🖨️✨</span>
            </button>
          </>
        )}

        {status === 'VALIDATING' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-kawaii-purple-light border-3 border-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1E293B] animate-spin">
              <Sparkles className="w-8 h-8 text-kawaii-purple" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Authorizing Job... ✨</h3>
            <p className="text-xs font-bold text-slate-500">Checking your pass & waking up the Epson printer!</p>
          </div>
        )}

        {status === 'PRINTING' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-kawaii-pink-light border-3 border-slate-900 rounded-4xl flex items-center justify-center mx-auto shadow-[5px_5px_0px_0px_#1E293B] animate-bounce-cute">
              <Printer className="w-10 h-10 text-kawaii-pink-dark" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">Printing Your Pages! 📄</h3>
            <p className="text-xs font-bold text-slate-500">Look at the printer output tray! It is coming right out!</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-lime-100 text-lime-600 border-3 border-slate-900 rounded-4xl flex items-center justify-center mx-auto shadow-[5px_5px_0px_0px_#1E293B] animate-bounce-cute">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="font-black text-slate-900 text-2xl">All Done! Yay! 🎉</h3>
            <p className="text-xs font-bold text-slate-600">Please take your fresh printouts from the tray. Have an awesome class! 💖</p>
            <button
              onClick={() => {
                setStatus('IDLE');
                setJobIdInput('');
              }}
              className="mt-4 bg-kawaii-yellow hover:bg-kawaii-yellow/90 border-2 border-slate-900 text-slate-900 text-xs font-black px-6 py-3 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] transition-all"
            >
              Print Another Document ✨
            </button>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 border-3 border-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1E293B]">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="font-black text-slate-900 text-xl">Uh-Oh!</h3>
            <p className="text-xs font-bold text-rose-600">{errorMessage}</p>
            <button
              onClick={() => setStatus('IDLE')}
              className="mt-4 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 text-xs font-black px-6 py-2.5 rounded-2xl shadow-sm transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
