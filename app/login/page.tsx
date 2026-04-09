'use client';

import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      // If user not found, we could try to create one, or just show error.
      // For simplicity, we'll try to create one if auth/user-not-found
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr: any) {
            setError(createErr.message);
        }
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-widest font-mono">
          <span className="text-[#00f2ff]">BLE</span> SENSE
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Sign in to access telemetry dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <form className="space-y-6" onSubmit={handleEmailSignIn}>
            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#333] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00f2ff] focus:border-[#00f2ff] sm:text-sm bg-black text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#333] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00f2ff] focus:border-[#00f2ff] sm:text-sm bg-black text-white"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#00f2ff] hover:bg-[#00d0db] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f2ff] focus:ring-offset-black disabled:opacity-50"
              >
                Sign in / Register
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#333]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0a0a0a] text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-[#333] rounded-md shadow-sm bg-black text-sm font-medium text-gray-300 hover:bg-[#111] disabled:opacity-50"
                >
                  Google
                </button>
              </div>

              <div>
                <button
                  onClick={handleAnonymousSignIn}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-[#333] rounded-md shadow-sm bg-black text-sm font-medium text-gray-300 hover:bg-[#111] disabled:opacity-50"
                >
                  Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
