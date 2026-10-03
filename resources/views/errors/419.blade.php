@include('errors.layout', [
    'code' => 419,
    'title' => 'Sesi Berakhir',
    'message' => 'Halaman ini sudah terlalu lama dibuka sehingga sesinya kedaluwarsa. Muat ulang halaman dan coba lagi.',
    'showReload' => true,
    'icon' => '<svg class="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>',
])
