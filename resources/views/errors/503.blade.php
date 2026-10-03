@include('errors.layout', [
    'code' => 503,
    'title' => 'Sedang Pemeliharaan',
    'message' => 'Aplikasi sedang dalam pemeliharaan singkat. Silakan coba kembali beberapa saat lagi.',
    'showReload' => true,
    'icon' => '<svg class="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.162-.188 1.743-.028l3.312.92a1.5 1.5 0 001.839-1.84l-.92-3.311a2.25 2.25 0 00-1.579-1.579l-3.311-.921a1.5 1.5 0 00-1.84 1.84l.92 3.312c.16.58.136 1.192-.028 1.743z" /></svg>',
])
