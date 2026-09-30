<?php

return [
    // Jabatan manajemen — dipakai bersama oleh piket kehadiran manajemen
    // (PiketController) dan laporan kehadiran manajemen (LaporanController)
    // supaya keduanya selalu sinkron, tidak ada role yang lupa ditambahkan
    // di satu tempat saja (kejadian sebelumnya untuk 'tim_penjamin_mutu').
    'management' => [
        'kepala_sekolah', 'wakasek_kurikulum', 'wakasek_kesiswaan',
        'wakasek_sarpras', 'wakasek_humas', 'kepala_konsentrasi_keahlian',
        'kepala_tatausaha', 'bendahara_sekolah', 'tim_penjamin_mutu',
    ],
];
