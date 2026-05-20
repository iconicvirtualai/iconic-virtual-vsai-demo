'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 47, s: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-800 to-amber-900 text-white text-sm font-bold">
              IV
            </div>
            <span className="tracking-widest">
              ICONIC VIRTUAL<span className="text-amber-800">.AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900">Services</a>
            <a href="#gallery" className="text-sm font-medium text-slate-600 hover:text-slate-900">Gallery</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-slate-900">How It Works</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Log In</Link>
            <Link href="/" className="rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ANNOUNCEMENT */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-amber-800 to-amber-900 py-3 text-center text-white text-sm font-semibold">
        Limited Time: AI Staging from <strong>$1/photo</strong> — Save up to 60% with membership plans
        <a href="#pricing" className="ml-2 underline font-bold">Claim Offer</a>
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            AI-powered • Results in 60 seconds
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            Virtual Staging that <span className="text-amber-800">sells a story</span>, not just square footage.
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Stop losing buyers at the first scroll. Our AI transforms empty rooms into magazine-worthy listings in under 60 seconds. DIY staging from $1/photo, or let our pro design team handle it.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/" className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-8 py-4 text-center font-semibold text-white hover:shadow-lg transition">
              Try AI Staging Free
            </Link>
            <a href="#pricing" className="w-full sm:w-auto rounded-lg border border-slate-300 px-8 py-4 text-center font-semibold text-slate-900 hover:border-slate-400 transition">
              See Pricing
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-4 pt-4 text-sm">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">JD</div>
              <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">MR</div>
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">SK</div>
            </div>
            <span>Trusted by <strong>12,000+</strong> agents • <strong>4.9★</strong> rating</span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-amber-400">$1</div>
            <div className="text-xs uppercase tracking-wider text-slate-300 mt-2">Per AI Staged Photo</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold">60s</div>
            <div className="text-xs uppercase tracking-wider text-slate-300 mt-2">Average Turnaround</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold">73%</div>
            <div className="text-xs uppercase tracking-wider text-slate-300 mt-2">Faster Listing Sales</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-amber-400">12K+</div>
            <div className="text-xs uppercase tracking-wider text-slate-300 mt-2">Agents Nationwide</div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-amber-50 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">Two Ways to Stage</div>
          <h2 className="text-4xl md:text-5xl font-bold">DIY AI or Pro Design Team — your call.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Whether you want instant results or custom perfection, we've got you covered.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AI Card - Featured */}
          <div className="rounded-2xl border-2 border-amber-800 bg-white p-8 shadow-lg">
            <div className="inline-block bg-amber-50 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-6">⚡ INSTANT RESULTS</div>
            <h3 className="text-2xl font-bold mb-2">AI Virtual Staging</h3>
            <p className="text-slate-600 mb-6">From <strong className="text-2xl text-slate-900">$1</strong><span className="text-slate-600">/image</span></p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex gap-2">✓ Results in under 60 seconds</li>
              <li className="flex gap-2">✓ 100+ design styles</li>
              <li className="flex gap-2">✓ Unlimited style variations</li>
              <li className="flex gap-2">✓ High-res 4K downloads</li>
              <li className="flex gap-2">✓ Commercial license included</li>
              <li className="flex gap-2">✓ No sign-up required to try</li>
            </ul>
            <Link href="/" className="w-full block text-center rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-3 font-semibold text-white hover:shadow-lg transition">
              Try AI Staging Free →
            </Link>
          </div>

          {/* Traditional Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow">
            <div className="inline-block bg-slate-100 text-slate-900 px-3 py-1 rounded-full text-xs font-bold mb-6">🎨 CUSTOM DESIGN</div>
            <h3 className="text-2xl font-bold mb-2">Professional Staging</h3>
            <p className="text-slate-600 mb-6">From <strong className="text-2xl text-slate-900">$6</strong><span className="text-slate-600">/image</span></p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex gap-2">✓ Expert design team</li>
              <li className="flex gap-2">✓ Magazine-quality results</li>
              <li className="flex gap-2">✓ Multi-angle room staging</li>
              <li className="flex gap-2">✓ 24-hour turnaround</li>
              <li className="flex gap-2">✓ 1-2 free revisions per image</li>
              <li className="flex gap-2">✓ Commercial license included</li>
            </ul>
            <a href="#pricing" className="w-full block text-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:border-slate-400 transition">
              View Pricing →
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20 md:py-32 bg-white -mx-6 px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-amber-50 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">How It Works</div>
          <h2 className="text-4xl md:text-5xl font-bold">From empty room to sold listing in 3 steps.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">No design skills needed. Just upload, pick a style, and download.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: 1, title: "Upload Your Photo", desc: "Drag and drop any empty room photo. JPG or PNG, up to 50MB." },
            { num: 2, title: "Choose Your Style", desc: "Pick from 100+ design styles — Modern, Coastal, Farmhouse, Luxury, and more." },
            { num: 3, title: "Download & List", desc: "Get your staged photo in under 60 seconds. High-res, MLS-ready." }
          ].map(step => (
            <div key={step.num} className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-amber-800 to-amber-900 text-white text-2xl font-bold flex items-center justify-center mx-auto">
                {step.num}
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/" className="inline-block rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-8 py-4 font-semibold text-white hover:shadow-lg transition">
            Try It Now — No Sign Up Required →
          </Link>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-amber-50 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">Pricing</div>
          <h2 className="text-4xl md:text-5xl font-bold">Simple pricing that scales with you.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Pay per image or save up to 60% with a membership.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { title: "AI Starter", price: "$39/mo", desc: "10 images/month", perImage: "$3.90" },
            { title: "AI Premium", price: "$79/mo", desc: "40 images/month", perImage: "$1.97", featured: true },
            { title: "AI Pro", price: "$160/mo", desc: "160 images/month", perImage: "$1.00" }
          ].map((plan, i) => (
            <div key={i} className={`rounded-2xl p-8 ${plan.featured ? 'border-2 border-amber-800 bg-white shadow-lg' : 'border border-slate-200 bg-white'}`}>
              {plan.featured && <div className="text-center mb-4 text-xs font-bold uppercase text-amber-900 bg-amber-50 px-3 py-1 rounded-full inline-block">Best Value</div>}
              <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
              <div className="text-3xl font-bold mb-1">{plan.price}</div>
              <p className="text-sm text-slate-600 mb-6">{plan.desc} • {plan.perImage} per image</p>
              <Link href="/" className={`w-full block text-center rounded-lg px-6 py-3 font-semibold transition ${plan.featured ? 'bg-gradient-to-r from-amber-800 to-amber-900 text-white hover:shadow-lg' : 'border border-slate-300 text-slate-900 hover:border-slate-400'}`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* URGENCY CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl text-center space-y-6">
        <h2 className="text-4xl font-bold">Your listing is losing buyers right now.</h2>
        <p className="text-lg text-slate-300">Vacant rooms get scrolled past. Staged rooms get saved, shared, and sold.</p>
        <div className="flex justify-center gap-4 mb-8">
          <div className="bg-white/10 px-6 py-4 rounded-lg">
            <div className="text-3xl font-bold">{String(timeLeft.h).padStart(2, '0')}</div>
            <div className="text-xs uppercase tracking-wider">Hours</div>
          </div>
          <div className="bg-white/10 px-6 py-4 rounded-lg">
            <div className="text-3xl font-bold">{String(timeLeft.m).padStart(2, '0')}</div>
            <div className="text-xs uppercase tracking-wider">Minutes</div>
          </div>
          <div className="bg-white/10 px-6 py-4 rounded-lg">
            <div className="text-3xl font-bold">{String(timeLeft.s).padStart(2, '0')}</div>
            <div className="text-xs uppercase tracking-wider">Seconds</div>
          </div>
        </div>
        <a href="#pricing" className="inline-block bg-white text-slate-900 px-8 py-4 font-bold rounded-lg hover:shadow-xl transition">
          Lock In This Price →
        </a>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20 md:py-32">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block bg-amber-50 text-amber-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">FAQ</div>
          <h2 className="text-4xl md:text-5xl font-bold">Got questions?</h2>
        </div>

        <div className="space-y-4">
          {[
            { q: "How quickly can I get my staged photos?", a: "AI staging is instant (under 60 seconds). Professional staging is delivered within 24 hours." },
            { q: "Can I try before I buy?", a: "Yes! Upload any room photo and see it staged instantly with our AI. No credit card required." },
            { q: "Do you offer revisions?", a: "Yes. AI includes free revision options, and professional staging includes 1-2 free redesigns." },
            { q: "Is virtual staging MLS-compliant?", a: "Yes, in most MLSs as long as you disclose that images are virtually staged." },
            { q: "Can I cancel my membership anytime?", a: "Absolutely. Cancel anytime in two clicks. You keep access through the end of your billing period." }
          ].map((item, i) => (
            <details key={i} className="rounded-lg border border-slate-200 p-6 group">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {item.q}
                <span className="group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-4 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-32 text-center space-y-8 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-2xl">
        <h2 className="text-4xl md:text-5xl font-bold">Stop losing buyers at the first scroll.</h2>
        <p className="text-lg text-amber-100">Stage your first room free. No sign up, no credit card, no commitments.</p>
        <Link href="/" className="inline-block bg-white text-amber-900 px-8 py-4 font-bold rounded-lg hover:shadow-xl transition">
          Try AI Staging Free →
        </Link>
        <p className="text-sm text-amber-100">🔒 Your photos are never shared. Commercial license included.</p>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12 mt-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-white mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-800 text-white flex items-center justify-center text-xs font-bold">IV</div>
                <span>ICONIC VIRTUAL.AI</span>
              </div>
              <p className="text-sm">AI-powered virtual staging for real estate professionals.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#services" className="hover:text-white transition">AI Staging</a></li>
                <li><a href="#gallery" className="hover:text-white transition">Gallery</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Help</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2026 IconicVirtual.AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
