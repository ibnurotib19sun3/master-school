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
        'block w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 transition-all duration-150 focus:outline-none',
        'border-white/15 bg-white/[0.06] backdrop-blur-sm',
        'focus:border-sky-300/50 focus:bg-white/[0.1] focus:ring-[3px] focus:ring-sky-300/15',
    ].join(' ');

    return (
        <GuestLayout>
            <Head title="Masuk" />
            <div>
                <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Selamat Datang</h2>
                <p className="text-sm text-white/40 mb-7">Masuk ke akun APIKMAS DJurnal Anda</p>

                {/* Pesan redirect dari halaman yang dilindungi */}
                {flash.redirect_message && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-300/25 bg-sky-400/10 px-4 py-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
                        <p className="text-sm text-sky-100">{flash.redirect_message}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">

                    {/* Email */}
                    <div>
                        <label className="block text-[13px] font-medium text-white/60 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
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
                            <p className="mt-1.5 text-xs text-red-300">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[13px] font-medium text-white/60 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
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
                                tabIndex={-1}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1.5 text-xs text-red-300">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember */}
                    <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-300/30 focus:ring-offset-0"
                        />
                        <label htmlFor="remember" className="text-sm text-white/50 select-none cursor-pointer">
                            Ingat saya
                        </label>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-150
                            bg-white hover:bg-sky-50 active:scale-[0.99] text-sky-700
                            shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15
                            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:active:scale-100"
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
                            text-white/35 hover:text-white/70"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Beranda
                    </Link>
                </form>
            </div>
        </GuestLayout>
    );
}
