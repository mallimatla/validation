'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-slate-400 hover:text-white mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Get Started</h1>
          <p className="text-slate-400 mt-2">Create your Startup Verdict account</p>
        </div>

        <div className="flex justify-center">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-slate-800 border border-slate-700 shadow-xl',
                headerTitle: 'text-white',
                headerSubtitle: 'text-slate-400',
                socialButtonsBlockButton: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
                socialButtonsBlockButtonText: 'text-white',
                formFieldLabel: 'text-slate-300',
                formFieldInput: 'bg-slate-900 border-slate-600 text-white',
                footerActionLink: 'text-emerald-400 hover:text-emerald-300',
                identityPreviewText: 'text-white',
                identityPreviewEditButton: 'text-emerald-400',
                formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700',
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  );
}
