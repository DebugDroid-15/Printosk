import Link from 'next/link';
import { Sparkles, Heart, Printer, QrCode, ArrowRight, Star, FileText, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Kawaii Cute Header */}
      <header className="border-b-4 border-kawaii-pink-light bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-kawaii-pink to-kawaii-pink-dark text-white p-3 rounded-3xl shadow-kawaii animate-bounce-cute">
              <Printer className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-800">
                  Printosk
                </span>
                <span className="bg-kawaii-yellow text-slate-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full border-2 border-slate-800 shadow-[2px_2px_0px_0px_#2D3748]">
                  v2.0 ✨
                </span>
              </div>
              <p className="text-[11px] font-bold text-kawaii-pink tracking-wide">
                Campus Self-Printing Bestie! 💕
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/upload"
              className="bg-kawaii-pink hover:bg-kawaii-pink-dark text-white font-black px-6 py-2.5 rounded-full border-2 border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[1px_1px_0px_0px_#1E293B] transition-all flex items-center space-x-2 text-sm"
            >
              <span>Upload PDF</span>
              <Sparkles className="w-4 h-4 text-kawaii-yellow" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 px-4 text-center max-w-4xl mx-auto relative">
          {/* Floating cute decorative stickers */}
          <div className="hidden sm:block absolute top-10 left-4 bg-kawaii-yellow-light border-2 border-slate-800 rounded-3xl p-3 shadow-[4px_4px_0px_0px_#1E293B] animate-float-cute rotate-[-6deg]">
            <span className="text-xl">🐱</span>
            <span className="text-xs font-black text-slate-800 ml-1.5">No Lines!</span>
          </div>
          <div className="hidden sm:block absolute top-14 right-4 bg-kawaii-mint-light border-2 border-slate-800 rounded-3xl p-3 shadow-[4px_4px_0px_0px_#1E293B] animate-float-cute rotate-[8deg]">
            <span className="text-xl">⚡</span>
            <span className="text-xs font-black text-slate-800 ml-1.5">Scan & Go!</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-kawaii-pink-light border-2 border-kawaii-pink text-kawaii-pink-dark px-4 py-1.5 rounded-full text-xs font-black mb-6 shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-kawaii-pink" />
            <span>The Cutest Campus Kiosk in Town</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            Assignments & Notes? <br />
            <span className="bg-gradient-to-r from-kawaii-pink to-kawaii-purple bg-clip-text text-transparent">
              Print in a Tap!
            </span>{' '}
            <span className="inline-block animate-wiggle">🌸</span>
          </h1>

          <p className="text-base sm:text-lg font-bold text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Forget slow cyber cafes and broken printers! Upload your PDF from your phone in class, pay pocket money rates with UPI, and grab your papers at the kiosk in seconds! 🎉
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/upload"
              className="w-full sm:w-auto bg-kawaii-pink hover:bg-kawaii-pink-dark text-white font-black text-base px-8 py-4 rounded-3xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center space-x-3"
            >
              <FileText className="w-5 h-5 text-kawaii-yellow" />
              <span>Start Printing Now! 🚀</span>
            </Link>

            <Link
              href="/kiosk/BBSR001"
              className="w-full sm:w-auto bg-white hover:bg-kawaii-mint-light text-slate-800 font-black text-base px-8 py-4 rounded-3xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center space-x-3"
            >
              <QrCode className="w-5 h-5 text-kawaii-pink" />
              <span>Try Kiosk QR Demo</span>
            </Link>
          </div>
        </section>

        {/* 3 Step Kawaii Workflow Cards */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-center text-slate-900 mb-3">
              Super Easy 3 Steps! ✨
            </h2>
            <p className="text-center font-bold text-slate-500 text-sm mb-12">
              Ready before your next lecture starts!
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-[6px_6px_0px_0px_#FF85A1] relative">
                <div className="w-14 h-14 rounded-3xl bg-kawaii-pink-light border-2 border-slate-900 flex items-center justify-center font-black text-2xl text-kawaii-pink-dark mb-4 shadow-[3px_3px_0px_0px_#1E293B]">
                  1
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-2">Upload & Customize</h3>
                <p className="font-semibold text-slate-600 text-sm leading-relaxed">
                  Drop your notes or assignment PDF. Pick Black & White (₹2) or vibrant Colour (₹10).
                </p>
                <div className="mt-4 inline-block bg-kawaii-pink-light text-kawaii-pink-dark text-xs font-black px-3 py-1 rounded-full border border-kawaii-pink">
                  Pocket Friendly 💖
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-[6px_6px_0px_0px_#BDB2FF] relative">
                <div className="w-14 h-14 rounded-3xl bg-kawaii-purple-light border-2 border-slate-900 flex items-center justify-center font-black text-2xl text-kawaii-purple mb-4 shadow-[3px_3px_0px_0px_#1E293B]">
                  2
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-2">Pay & Get Job ID</h3>
                <p className="font-semibold text-slate-600 text-sm leading-relaxed">
                  Quick UPI payment via GPay/PhonePe. Instantly get a cute 6-digit Job ID: <span className="text-kawaii-pink font-black">PSK-824691</span>.
                </p>
                <div className="mt-4 inline-block bg-kawaii-purple-light text-purple-700 text-xs font-black px-3 py-1 rounded-full border border-kawaii-purple">
                  Valid 60 Mins ⏰
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border-3 border-slate-900 rounded-4xl p-6 shadow-[6px_6px_0px_0px_#9BF6FF] relative">
                <div className="w-14 h-14 rounded-3xl bg-kawaii-mint-light border-2 border-slate-900 flex items-center justify-center font-black text-2xl text-teal-600 mb-4 shadow-[3px_3px_0px_0px_#1E293B]">
                  3
                </div>
                <h3 className="font-black text-xl text-slate-900 mb-2">Scan QR & Grab!</h3>
                <p className="font-semibold text-slate-600 text-sm leading-relaxed">
                  Walk to the kiosk outside your library or canteen, scan the cute QR code, tap print, and collect!
                </p>
                <div className="mt-4 inline-block bg-kawaii-mint-light text-teal-700 text-xs font-black px-3 py-1 rounded-full border border-teal-300">
                  Instant Warm Paper 📄
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Kawaii Footer */}
      <footer className="border-t-4 border-kawaii-pink-light py-8 text-center text-sm font-bold text-slate-500 bg-white">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-kawaii-pink fill-kawaii-pink animate-pulse" />
          <span>for schools & colleges</span>
        </div>
        <p className="text-xs text-slate-400">© 2026 Printosk 2.0. Clean, automated, cute self-service kiosk.</p>
      </footer>
    </div>
  );
}
