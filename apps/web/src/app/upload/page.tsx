'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Sparkles, Heart, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [colourMode, setColourMode] = useState<'BW' | 'COLOUR'>('BW');
  const [copies, setCopies] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Updated student pricing: B&W = ₹1.50, Colour = ₹5.00
  const BW_RATE = 1.5; // ₹1.50 per page
  const COLOUR_RATE = 5.0; // ₹5.00 per page

  const ratePerPage = colourMode === 'BW' ? BW_RATE : COLOUR_RATE;
  const totalAmount = (totalPages * copies * ratePerPage).toFixed(2);
  const totalAmountPaise = Math.round(Number(totalAmount) * 100);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Oops! Please upload a PDF file 📄');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File is a bit too heavy! Max 25MB allowed 🎒');
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPageCount();
      setTotalPages(pages);
    } catch (err: any) {
      setError('Could not count pages. But no worries, we will handle it! 🌸');
      setTotalPages(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProceedToGenerateCode = async () => {
    if (!file) return;
    setIsProcessingPayment(true);
    setError(null);

    try {
      // Direct instant generation for testing mode (bypassing Razorpay popup)
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: `test_ord_${Date.now()}`,
          razorpay_payment_id: `test_pay_${Date.now()}`,
          testMode: true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate kiosk code');
      }

      router.push(
        `/payment-success?jobId=${data.jobId}&pages=${totalPages}&copies=${copies}&amount=${totalAmount}`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to generate code. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center space-x-1.5 text-xs font-black text-kawaii-pink hover:text-kawaii-pink-dark">
          <span>← Back to Home</span>
        </Link>
      </div>

      <div className="mb-8 text-center">
        <div className="inline-block bg-kawaii-yellow-light text-slate-800 text-xs font-black px-3.5 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_#1E293B] mb-3">
          Step 1 of 2 🌟
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Drop Your PDF Here! 📄✨
        </h1>
        <p className="font-bold text-slate-500 mt-2 text-sm">
          Select color mode, pick copies, and we will calculate the best price!
        </p>
      </div>

      <div className="bg-white border-3 border-slate-900 rounded-4xl shadow-[8px_8px_0px_0px_#FF85A1] p-6 sm:p-8 space-y-6">
        {/* Upload Box */}
        <div>
          <label className="block text-sm font-black text-slate-800 mb-2">
            Select Your Document 🎀
          </label>
          <div className="border-3 border-dashed border-kawaii-pink hover:bg-kawaii-pink-light/30 rounded-3xl p-8 text-center transition-all cursor-pointer relative bg-kawaii-cream">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-kawaii-pink-light text-kawaii-pink-dark border-2 border-slate-900 rounded-3xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1E293B] animate-bounce-cute">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-sm font-black text-slate-800">
                <span className="text-kawaii-pink-dark underline decoration-2">Tap to browse</span> or drop file here!
              </div>
              <p className="text-xs font-bold text-slate-400">PDF up to 25MB allowed</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 border-2 border-rose-300 p-3.5 rounded-2xl text-xs font-black">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {file && (
          <div className="flex items-center justify-between p-4 bg-kawaii-mint-light border-2 border-slate-900 rounded-3xl shadow-[3px_3px_0px_0px_#1E293B]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white border-2 border-slate-900 rounded-2xl shadow-sm">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm truncate max-w-[180px] sm:max-w-xs">{file.name}</p>
                <p className="text-xs font-bold text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black px-3 py-1 bg-white border-2 border-slate-900 text-slate-900 rounded-full shadow-[2px_2px_0px_0px_#1E293B]">
                {isAnalyzing ? 'Counting...' : `✨ ${totalPages} Pages`}
              </span>
            </div>
          </div>
        )}

        {/* Configuration Options */}
        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t-2 border-slate-100">
          <div>
            <label className="block text-sm font-black text-slate-800 mb-2">Color Style 🎨</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setColourMode('BW')}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs transition-all ${
                  colourMode === 'BW'
                    ? 'border-slate-900 bg-kawaii-yellow-light text-slate-900 shadow-[3px_3px_0px_0px_#1E293B]'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Black & White <br />
                <span className="text-[11px] font-bold text-slate-500">₹{BW_RATE.toFixed(2)} / page</span>
              </button>
              <button
                type="button"
                onClick={() => setColourMode('COLOUR')}
                className={`py-3 px-3 rounded-2xl border-2 font-black text-xs transition-all ${
                  colourMode === 'COLOUR'
                    ? 'border-slate-900 bg-kawaii-pink-light text-slate-900 shadow-[3px_3px_0px_0px_#1E293B]'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Vibrant Colour 🌈 <br />
                <span className="text-[11px] font-bold text-slate-500">₹{COLOUR_RATE.toFixed(2)} / page</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-800 mb-2">Copies 📚</label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="w-12 h-12 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center font-black text-xl hover:bg-slate-50 shadow-[2px_2px_0px_0px_#1E293B]"
              >
                -
              </button>
              <span className="font-black text-2xl w-10 text-center text-slate-900">{copies}</span>
              <button
                type="button"
                onClick={() => setCopies(Math.min(20, copies + 1))}
                className="w-12 h-12 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center font-black text-xl hover:bg-slate-50 shadow-[2px_2px_0px_0px_#1E293B]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="pt-6 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Pocket Cost</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">₹{totalAmount}</p>
          </div>
          <button
            type="button"
            disabled={!file || isAnalyzing || isProcessingPayment}
            onClick={handleProceedToGenerateCode}
            className="w-full sm:w-auto bg-kawaii-pink hover:bg-kawaii-pink-dark disabled:opacity-50 text-white font-black text-base px-8 py-4 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[1px_1px_0px_0px_#1E293B] transition-all flex items-center justify-center space-x-2"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Kiosk Code...</span>
              </>
            ) : (
              <>
                <span>Proceed & Generate Code 🚀</span>
                <Sparkles className="w-5 h-5 text-kawaii-yellow" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
