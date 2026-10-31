import { useForm, Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
    const [showPass, setShowPass] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const flash = usePage().props.flash ?? {};

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <GuestLayout>
            <Head title="Masuk - APIKMAS DJurnal" />

            <div>
                {/* Logo APIKMAS DJurnal */}
                <div className="flex items-center justify-center gap-3 select-none mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700/60 p-2 flex items-center justify-center">
                        <img src="/logodjurnalwarna.svg" alt="APIKMAS DJurnal" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
                            APIKMAS <span className="text-sky-600 dark:text-sky-400">DJurnal</span>
                        </span>
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Sistem Informasi Sekolah
                        </span>
                    </div>
                </div>

                {/* Subtitle & Heading */}
                <div className="mb-6 text-center sm:text-left">
                    <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
                        Masuk ke akun Anda
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Selamat Datang
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Masukkan email dan password untuk mengakses portal sekolah.
                    </p>
                </div>

                {/* Redirect notification message */}
                {flash.redirect_message && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/80 dark:bg-sky-950/40 p-3.5">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                        <p className="text-xs text-sky-800 dark:text-sky-200 leading-snug">{flash.redirect_message}</p>
                    </div>
                )}

                {/* Form Login */}
                <form onSubmit={submit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="nama@email.com"
                                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                autoFocus
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <span
                                title="Hubungi administrator sekolah jika lupa password"
                                className="text-[11px] font-medium text-gray-400 dark:text-gray-500"
                            >
                                Lupa sandi? Hubungi Admin
                            </span>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                tabIndex={-1}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember */}
                    <div className="flex items-center gap-2 pt-0.5">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-sky-600 focus:ring-sky-500 dark:bg-gray-800 dark:checked:bg-sky-600"
                        />
                        <label htmlFor="remember" className="text-xs text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                            Ingat saya di perangkat ini
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] shadow-md shadow-sky-600/20 hover:shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>Masuk ke Akun</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Back to Home Link */}
                    <div className="pt-4 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Kembali ke Beranda
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
