<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Error' }} — {{ config('app.name', 'APIKMAS DJurnal') }}</title>
    <link rel="icon" type="image/svg+xml" href="/logodjurnalwarna.svg">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css'])

    {{-- Error pages tidak dirender lewat Inertia/React (harus tetap tampil walau
    asset JS gagal dimuat atau server sedang error), jadi dark mode dibaca manual
    dari localStorage yang sama dipakai ThemeContext supaya temanya tetap konsisten. --}}
    <script>
        try {
            if ((localStorage.getItem('theme') ?? 'dark') === 'dark') {
                document.documentElement.classList.add('dark');
            }
        } catch (e) {}
    </script>
</head>
<body class="h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
    <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div class="w-full max-w-md text-center">
            <div class="relative mx-auto mb-6 h-20 w-20">
                <div class="absolute inset-0 rounded-2xl bg-sky-400/20 blur-xl"></div>
                <div class="relative h-20 w-20 rounded-2xl bg-sky-600 shadow-lg shadow-sky-600/30 flex items-center justify-center">
                    {!! $icon !!}
                </div>
            </div>
            <p class="text-sm font-bold tracking-[0.2em] text-sky-600 dark:text-sky-400 uppercase mb-2">Error {{ $code }}</p>
            <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{{ $title }}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{{ $message }}</p>
            <div class="flex items-center justify-center gap-3 flex-wrap">
                <a href="/" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-sky-600/20">
                    Kembali ke Beranda
                </a>
                @if(!empty($showReload))
                <button onclick="window.location.reload()" type="button" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Muat Ulang
                </button>
                @endif
            </div>
        </div>
        <p class="mt-14 text-xs text-gray-400 dark:text-gray-600">&copy; {{ date('Y') }} APIKMAS DJurnal</p>
    </div>
</body>
</html>
