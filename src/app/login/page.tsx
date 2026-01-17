
import { login, signup } from './actions';
import { Mail, Lock, UserPlus, LogIn, Battery, Zap } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {/* Brand Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="p-3 bg-brand-600 rounded-2xl shadow-lg shadow-brand-500/30">
                        <Battery className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                    iTarang CRM
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                    Next-Gen EV Fleet Management
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="card-parcel">
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="input-parcel pl-10"
                                    placeholder="you@itarang.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="input-parcel pl-10"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                formAction={login}
                                className="btn-primary w-full justify-center"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign in
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-400">Or</span>
                                </div>
                            </div>

                            <button
                                formAction={signup}
                                className="w-full flex justify-center py-2.5 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create new account
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Powered by Supabase Auth & Next.js 15
                </p>
            </div>
        </div>
    )
}
