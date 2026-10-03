@include('errors.layout', [
    'code' => 403,
    'title' => 'Akses Ditolak',
    'message' => 'Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi admin jika menurut Anda ini keliru.',
    'icon' => '<svg class="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>',
])
