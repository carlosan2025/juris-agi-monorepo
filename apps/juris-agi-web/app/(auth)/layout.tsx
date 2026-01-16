'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Video Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/auth-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-slate-900/60" />

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center">
            <Image
              src="/juris-logo.png"
              alt="Juris"
              width={120}
              height={40}
              className="invert"
            />
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Evidence-Based Decision Intelligence
            </h1>
            <p className="text-lg text-slate-200 max-w-md">
              Transform your investment decisions with AI-powered analysis,
              counterfactual reasoning, and comprehensive audit trails.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-blue-400">100%</div>
                <div className="text-sm text-slate-300">Audit Compliant</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">10x</div>
                <div className="text-sm text-slate-300">Faster Analysis</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">360°</div>
                <div className="text-sm text-slate-300">Decision View</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            © 2024 JURIS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image
              src="/juris-logo.png"
              alt="Juris"
              width={100}
              height={35}
              className="dark:invert"
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
