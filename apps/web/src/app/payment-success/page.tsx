'use client';

import { useSearchParams } from 'next/navigation';
import { Sparkles, Copy, Clock, MapPin, Printer, Heart, CheckCircle2 } from 'lucide-react';
import { useState, Suspense } from 'react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId') || 'PSK-824691';
  const pages = searchParams.get('pages') || '1';
  const copies = searchParams.get('copies') || '1';
  const amount = searchParams.get('amount') || '2.00';

  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-white border-3 border-slate-900 rounded-5xl shadow-[8px_8px_0px_0px_#70E000] p-6 sm:p-8 text-center space-y-6">
        {/* Animated Badge */}
        <div className="w-20 h-20 bg-lime-100 text-lime-600 border-3 border-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#1E293B] animate-bounce-cute">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <div className="inline-block bg-kawaii-yellow text-slate-900 text-xs font-black px-3 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_#1E293B] mb-2">
            Payment Verified! 🎉
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Woohoo! Job is Ready! ✨</h1>
          <p className="font-bold text-slate-500 text-sm mt-1">Here is your special kiosk pass to release the papers:</p>
        </div>

        {/* Big Kawaii Job ID Box */}
        <div className="bg-kawaii-pink-light/50 border-3 border-dashed border-kawaii-pink rounded-3xl p-6 text-center">
          <p className="text-xs uppercase font-black text-kawaii-pink-dark tracking-wider mb-2">
            YOUR SECRET JOB ID 💕
          </p>
          <div className="flex items-center justify-center space-x-3">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
              {jobId}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-3 bg-white hover:bg-kawaii-pink-light border-2 border-slate-900 rounded-2xl text-slate-900 shadow-[3px_3px_0px_0px_#1E293B] active:shadow-[1px_1px_0px_0px_#1E293B] transition-all"
              title="Copy Job ID"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <p className="text-xs text-kawaii-pink-dark mt-2 font-black">Copied to clipboard! 📋✨</p>}
        </div>

        {/* Expiry Warning */}
        <div className="flex items-center justify-center space-x-2 text-amber-900 bg-kawaii-yellow-light p-3.5 rounded-2xl text-xs font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#1E293B]">
          <Clock className="w-4 h-4 flex-shrink-0 text-amber-700" />
          <span>Valid for 60 mins. Pick it up before class ends! ⏰</span>
        </div>

        {/* Job Details */}
        <div className="border-t-2 border-slate-100 pt-4 text-left text-xs sm:text-sm font-bold space-y-2 text-slate-600">
          <div className="flex justify-between">
            <span>Pages & Copies:</span>
            <span className="font-black text-slate-900">{pages} pages × {copies} copy</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span className="font-black text-slate-900">₹{amount} (Paid via UPI)</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-kawaii-mint-light rounded-3xl p-5 text-left border-2 border-slate-900 shadow-[3px_3px_0px_0px_#1E293B]">
          <h3 className="font-black text-teal-900 text-sm flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>How to grab your printout:</span>
          </h3>
          <ol className="text-xs font-bold text-teal-800 space-y-1.5 list-decimal list-inside">
            <li>Walk to the kiosk outside your library / canteen.</li>
            <li>Scan the kiosk QR code with your camera.</li>
            <li>Enter <span className="font-black text-slate-900">{jobId}</span> and click Start Printing!</li>
          </ol>
        </div>

        <Link
          href={`/kiosk/BBSR001?prefill=${jobId}`}
          className="w-full bg-kawaii-purple hover:bg-kawaii-purple/90 text-white font-black py-4 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_#1E293B] transition-all flex items-center justify-center space-x-2 text-sm"
        >
          <span>Open Kiosk Page Now →</span>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading pass...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
