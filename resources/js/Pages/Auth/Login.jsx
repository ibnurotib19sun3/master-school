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

    const inputCls = [
        'block w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-colors focus:outline-none',
        // Light
        'border-gray-300 bg-white text-gray-900 placeholder-gray-400',
        'focus:border-sky-500 focus:ring-1 focus:ring-sky-500',
        // Dark
        'dark:border-white/15 dark:bg-white/10 dark:backdrop-blur-sm dark:text-white dark:placeholder-white/30',
        'dark:focus:border-sky-300/60 dark:focus:ring-1 dark:focus:ring-sky-300/40',
    ].join(' ');

    return (
        <GuestLayout>
            <Head title="Masuk" />
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Selamat Datang</h2>
                <p className="text-sm text-gray-500 dark:text-white/40 mb-6">Masuk ke akun APIKMAS DJurnal Anda</p>

                {/* Pesan redirect dari halaman yang dilindungi */}
                {flash.redirect_message && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/30 dark:bg-sky-500/10">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                        <p className="text-sm text-sky-700 dark:text-sky-300">{flash.redirect_message}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="nama@email.com"
                                className={inputCls}
                                autoFocus
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1.5 text-xs text-red-500 dark:text-red-300">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className={`${inputCls} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1.5 text-xs text-red-500 dark:text-red-300">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember */}
                    <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 text-sky-600 focus:ring-sky-500 dark:focus:ring-sky-400/40"
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 dark:text-white/50 select-none cursor-pointer">
                            Ingat saya
                        </label>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed
                            bg-sky-600 hover:bg-sky-700 text-white
                            dark:bg-white dark:hover:bg-sky-50 dark:text-sky-700"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Memuat...
                            </>
                        ) : (
                            <>Masuk <ArrowRight className="h-4 w-4" /></>
                        )}
                    </button>

                    {/* Kembali ke Beranda */}
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-medium transition-colors
                            text-gray-500 hover:text-sky-600 dark:text-white/40 dark:hover:text-white/70"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Beranda
                    </Link>
                </form>
            </div>
        </GuestLayout>
    );
}
