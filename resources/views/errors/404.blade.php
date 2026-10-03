@include('errors.layout', [
    'code' => 404,
    'title' => 'Halaman Tidak Ditemukan',
    'message' => 'Halaman yang Anda cari tidak tersedia, sudah dipindahkan, atau alamatnya salah ketik.',
    'icon' => '<svg class="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM9.879 9.879a1.5 1.5 0 112.121 2.121M12 15h.008v.008H12V15z" /></svg>',
])
