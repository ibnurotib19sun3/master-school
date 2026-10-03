@include('errors.layout', [
    'code' => 429,
    'title' => 'Terlalu Banyak Permintaan',
    'message' => 'Anda mengirim permintaan terlalu cepat/sering. Tunggu sebentar lalu coba lagi.',
    'showReload' => true,
    'icon' => '<svg class="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>',
])
