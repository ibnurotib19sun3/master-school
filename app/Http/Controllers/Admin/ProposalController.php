<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Shared\Converter;
use PhpOffice\PhpWord\Element\Section;

class ProposalController extends Controller
{
    // Brand colours (hex, no #)
    private const C_NAVY   = '1B2A5E';   // deep navy
    private const C_INDIGO = '3B4FBF';   // main accent
    private const C_TEAL   = '0D7F8C';   // secondary accent
    private const C_LIGHT  = 'EFF2FB';   // light tint
    private const C_MUTED  = '5A6784';   // body muted
    private const C_BORDER = 'D0D8EF';   // table border
    private const C_WHITE  = 'FFFFFF';
    private const C_BLACK  = '111827';

    public function download()
    {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(11);
        $phpWord->getSettings()->setUpdateFields(true);

        // ── Font styles ────────────────────────────────────────────
        $phpWord->addFontStyle('h1',     ['name' => 'Calibri', 'size' => 24, 'bold' => true,  'color' => self::C_WHITE]);
        $phpWord->addFontStyle('h2',     ['name' => 'Calibri', 'size' => 14, 'bold' => true,  'color' => self::C_NAVY]);
        $phpWord->addFontStyle('h3',     ['name' => 'Calibri', 'size' => 11, 'bold' => true,  'color' => self::C_NAVY]);
        $phpWord->addFontStyle('body',   ['name' => 'Calibri', 'size' => 10, 'color' => self::C_BLACK]);
        $phpWord->addFontStyle('muted',  ['name' => 'Calibri', 'size' =>  9, 'color' => self::C_MUTED]);
        $phpWord->addFontStyle('label',  ['name' => 'Calibri', 'size' =>  8, 'bold' => true, 'color' => self::C_INDIGO, 'allCaps' => true]);
        $phpWord->addFontStyle('cover',  ['name' => 'Calibri', 'size' => 10, 'color' => 'C7D2FE']);
        $phpWord->addFontStyle('covSub', ['name' => 'Calibri', 'size' => 12, 'color' => 'A5B4FC', 'italic' => true]);
        $phpWord->addFontStyle('meta',   ['name' => 'Calibri', 'size' =>  9, 'color' => 'C7D2FE']);
        $phpWord->addFontStyle('metaLbl',['name' => 'Calibri', 'size' =>  8, 'bold' => true, 'color' => '818CF8', 'allCaps' => true]);
        $phpWord->addFontStyle('statN',  ['name' => 'Calibri', 'size' => 20, 'bold' => true,  'color' => self::C_INDIGO]);
        $phpWord->addFontStyle('statL',  ['name' => 'Calibri', 'size' =>  8, 'color' => self::C_MUTED]);
        $phpWord->addFontStyle('chip',   ['name' => 'Calibri', 'size' =>  8, 'bold' => true,  'color' => self::C_INDIGO]);
        $phpWord->addFontStyle('eyebrow',['name' => 'Calibri', 'size' =>  8, 'bold' => true,  'color' => self::C_TEAL, 'allCaps' => true]);
        $phpWord->addFontStyle('pHead',  ['name' => 'Calibri', 'size' =>  9, 'bold' => true,  'color' => self::C_WHITE]);
        $phpWord->addFontStyle('pPrice', ['name' => 'Calibri', 'size' => 13, 'bold' => true,  'color' => self::C_NAVY]);
        $phpWord->addFontStyle('pSub',   ['name' => 'Calibri', 'size' =>  8, 'color' => self::C_MUTED]);
        $phpWord->addFontStyle('checkY', ['name' => 'Calibri', 'size' =>  9, 'bold' => true,  'color' => '16A34A']);
        $phpWord->addFontStyle('checkN', ['name' => 'Calibri', 'size' =>  9, 'color' => self::C_MUTED]);
        $phpWord->addFontStyle('ctaLbl', ['name' => 'Calibri', 'size' =>  8, 'bold' => true,  'color' => '93C5FD', 'allCaps' => true]);
        $phpWord->addFontStyle('ctaVal', ['name' => 'Calibri', 'size' => 10, 'bold' => true,  'color' => self::C_WHITE]);
        $phpWord->addFontStyle('ftrTxt', ['name' => 'Calibri', 'size' =>  8, 'color' => self::C_MUTED, 'italic' => true]);
        $phpWord->addFontStyle('sigName',['name' => 'Calibri', 'size' => 11, 'bold' => true,  'color' => self::C_NAVY]);
        $phpWord->addFontStyle('sigRole',['name' => 'Calibri', 'size' =>  9, 'color' => self::C_MUTED]);

        // ── Paragraph styles ───────────────────────────────────────
        $phpWord->addParagraphStyle('pCenter',  ['alignment' => 'center', 'spaceAfter' => 0, 'spaceBefore' => 0]);
        $phpWord->addParagraphStyle('pLeft',    ['alignment' => 'left',   'spaceAfter' => 0, 'spaceBefore' => 0]);
        $phpWord->addParagraphStyle('pBody',    ['alignment' => 'both',   'spaceAfter' => 100, 'spaceBefore' => 0, 'lineHeight' => 1.3]);
        $phpWord->addParagraphStyle('pBodySm',  ['alignment' => 'both',   'spaceAfter' => 60,  'spaceBefore' => 0]);
        $phpWord->addParagraphStyle('pSection', ['alignment' => 'left',   'spaceAfter' => 0,   'spaceBefore' => 280]);
        $phpWord->addParagraphStyle('pBullet',  ['alignment' => 'left',   'spaceAfter' => 50,  'spaceBefore' => 0,  'indentation' => ['left' => 340, 'hanging' => 200]]);
        $phpWord->addParagraphStyle('pNoSp',    ['spaceAfter' => 0, 'spaceBefore' => 0]);

        // ── Table styles ───────────────────────────────────────────
        $phpWord->addTableStyle('tblMain', [
            'borderColor' => self::C_BORDER, 'borderSize' => 4, 'cellMargin' => 80,
        ]);
        $phpWord->addTableStyle('tblFeat', [
            'borderColor' => self::C_BORDER, 'borderSize' => 4, 'cellMargin' => 90,
        ]);
        $phpWord->addTableStyle('tblPrice', [
            'borderColor' => self::C_BORDER, 'borderSize' => 4, 'cellMargin' => 100,
        ]);
        $phpWord->addTableStyle('tblSig', ['borderSize' => 0, 'cellMargin' => 60]);
        $phpWord->addTableStyle('tblMeta', ['borderSize' => 0, 'cellMargin' => 50]);

        // ════════════════════════════════════════════════════════════
        // SECTION 1 — Cover + Body
        // ════════════════════════════════════════════════════════════
        $sec = $phpWord->addSection([
            'marginTop'    => Converter::cmToTwip(0),
            'marginBottom' => Converter::cmToTwip(1.5),
            'marginLeft'   => Converter::cmToTwip(2.5),
            'marginRight'  => Converter::cmToTwip(2.5),
            'headerHeight' => Converter::cmToTwip(0),
            'footerHeight' => Converter::cmToTwip(1.2),
        ]);

        // Running footer
        $footer = $sec->addFooter();
        $footer->addText(
            'APIKMAS DJurnal  —  Proposal Penawaran Resmi  |  Rahasia &amp; Terbatas',
            'ftrTxt', ['alignment' => 'center', 'spaceAfter' => 0]
        );

        // ── COVER: full-bleed dark block ────────────────────────────
        $covTbl = $sec->addTable(['borderSize' => 0, 'cellMargin' => 0]);
        $covRow = $covTbl->addRow(Converter::cmToTwip(11.5));
        $cov    = $covRow->addCell(Converter::cmToTwip(16.5), [
            'bgColor' => self::C_NAVY, 'vAlign' => 'center',
        ]);

        // Accent stripe (inner table trick)
        $innerTbl = $cov->addTable(['borderSize' => 0, 'cellMargin' => 200]);
        $innerTbl->addRow()->addCell(Converter::cmToTwip(0.5), ['bgColor' => self::C_TEAL])->addText('', [], 'pNoSp');

        $cov->addText('PROPOSAL PENAWARAN RESMI', [
            'name' => 'Calibri', 'size' => 8, 'bold' => true,
            'color' => '7DD3FC', 'allCaps' => true,
        ], ['spaceAfter' => 60, 'spaceBefore' => 140, 'alignment' => 'left']);

        $cov->addText('APIKMAS DJurnal', [
            'name' => 'Calibri', 'size' => 32, 'bold' => true, 'color' => self::C_WHITE,
        ], ['spaceAfter' => 40, 'alignment' => 'left']);

        $cov->addText('Sistem Informasi Manajemen Sekolah Digital', [
            'name' => 'Calibri', 'size' => 13, 'color' => 'A5B4FC', 'italic' => true,
        ], ['spaceAfter' => 160, 'alignment' => 'left']);

        $cov->addText(
            'Platform terintegrasi untuk jurnal mengajar, presensi siswa, manajemen surat elektronik, '
            . 'evaluasi KPI, dan administrasi akademik sekolah — berbasis web, aman, dan dapat diakses kapan saja.',
            ['name' => 'Calibri', 'size' => 10, 'color' => '94A3B8'],
            ['spaceAfter' => 180, 'alignment' => 'both']
        );

        // Meta info
        $metaTbl = $cov->addTable(['borderSize' => 0, 'cellMargin' => 60]);
        $metaRows = [
            ['No. Proposal',    'DJRN/2026/' . str_pad(rand(1, 99), 3, '0', STR_PAD_LEFT)],
            ['Tanggal',         now()->translatedFormat('d F Y')],
            ['Berlaku Hingga',  '31 Agustus 2026'],
            ['Diajukan Kepada', 'Yth. Kepala Sekolah / Pimpinan Institusi'],
        ];
        foreach ($metaRows as [$lbl, $val]) {
            $mr = $metaTbl->addRow();
            $mr->addCell(Converter::cmToTwip(4))->addText($lbl, 'metaLbl', 'pNoSp');
            $mr->addCell(Converter::cmToTwip(12))->addText($val, 'meta', 'pNoSp');
        }

        // ── BODY starts here ────────────────────────────────────────
        $sec->addTextBreak(2);

        // ── 01. PENDAHULUAN ─────────────────────────────────────────
        $this->sectionHead($sec, '01  PENDAHULUAN', 'Latar Belakang &amp; Tujuan Penawaran');

        $sec->addText(
            'Satuan pendidikan di Indonesia menghadapi tekanan yang semakin besar untuk beroperasi secara efisien, '
            . 'akuntabel, dan transparan. Pengelolaan jurnal mengajar yang masih berbasis kertas, presensi manual, '
            . 'serta persuratan yang tidak terarsip dengan baik menjadi hambatan nyata dalam meningkatkan mutu layanan pendidikan.',
            'body', 'pBody'
        );
        $sec->addText(
            'APIKMAS DJurnal hadir untuk menjawab tantangan tersebut: sebuah platform manajemen sekolah berbasis web '
            . 'yang komprehensif, mudah digunakan, dan dapat dikustomisasi sesuai kebutuhan institusi Anda. '
            . 'Proposal ini merupakan tawaran resmi kerja sama implementasi dan lisensi penggunaan platform.',
            'body', 'pBody'
        );

        // Stats 4-kolom
        $sec->addTextBreak(1);
        $sTbl = $sec->addTable('tblMain');
        $sRow = $sTbl->addRow();
        foreach ([['10+', 'Peran Pengguna RBAC'], ['12+', 'Modul Terintegrasi'], ['100%', 'Berbasis Web'], ['24/7', 'Akses Kapan Saja']] as [$n, $l]) {
            $sc = $sRow->addCell(Converter::cmToTwip(4), ['bgColor' => self::C_LIGHT, 'vAlign' => 'center']);
            $sc->addText($n, 'statN', 'pCenter');
            $sc->addText($l, 'statL', 'pCenter');
        }
        $sec->addTextBreak(1);

        // ── 02. TENTANG APLIKASI ────────────────────────────────────
        $this->sectionHead($sec, '02  TENTANG APLIKASI', 'Apa itu APIKMAS DJurnal?');

        $sec->addText(
            'APIKMAS DJurnal (Aplikasi Manajemen Kelas dan Sekolah — Digital Jurnal) adalah sistem informasi manajemen '
            . 'sekolah berbasis web yang dibangun di atas teknologi modern: Laravel 13, React 19, dan Inertia.js. '
            . 'Sistem ini dirancang khusus untuk kebutuhan SMK/SMA, namun cukup fleksibel untuk jenjang pendidikan lainnya.',
            'body', 'pBody'
        );
        $sec->addText(
            'Seluruh siklus administrasi akademik dikelola dalam satu dashboard yang disesuaikan per peran pengguna — '
            . 'dari jurnal mengajar harian guru, presensi siswa, manajemen surat elektronik berstempel QR, '
            . 'hingga evaluasi KPI kinerja secara berkala.',
            'body', 'pBody'
        );
        $sec->addText(
            'Catatan: Seluruh data tersimpan di server sekolah sendiri (self-hosted). '
            . 'Privasi dan kepemilikan data sepenuhnya berada di tangan institusi Anda.',
            'muted', 'pBodySm'
        );
        $sec->addTextBreak(1);

        // Key advantages
        $advantages = [
            'Antarmuka modern dan responsif — dapat diakses dari laptop, tablet, maupun ponsel.',
            'Sistem hak akses berbasis peran (RBAC) dengan 10+ peran yang dapat dikonfigurasi.',
            'Tidak bergantung pada layanan pihak ketiga — seluruh operasi berjalan di server Anda.',
            'Dukungan tanda tangan elektronik dan verifikasi QR Code pada surat keluar resmi.',
            'Laporan otomatis dalam format Excel dan PDF, siap digunakan tanpa rekap manual.',
        ];
        foreach ($advantages as $adv) {
            $sec->addText('*  ' . $adv, 'body', 'pBullet');
        }
        $sec->addTextBreak(1);

        // ── 03. FITUR UNGGULAN ──────────────────────────────────────
        $this->sectionHead($sec, '03  FITUR UNGGULAN', '12 Modul Terintegrasi dalam Satu Platform');

        $features = [
            ['Jurnal Digital',        'Jurnal mengajar guru per pertemuan, jurnal harian pimpinan, pokja, dan tata usaha — tercatat real-time dan dapat diverifikasi.'],
            ['Presensi Siswa',        'Input kehadiran per pertemuan dengan rekap otomatis harian, mingguan, dan bulanan. Siap untuk laporan dan cetak rapor.'],
            ['Media Pembelajaran',    'Repositori video, modul ajar, jobsheet, dan presentasi terorganisir per mata pelajaran dan rombel belajar.'],
            ['Penilaian &amp; KPI',       'Nilai siswa per kompetensi dengan histogram otomatis, evaluasi KPI guru dan staf tata usaha berbasis indikator terukur.'],
            ['Manajemen Surat',       'Surat masuk dan keluar dengan nomor otomatis, disposisi, arsip digital, dan salinan nomor surat satu klik.'],
            ['TTE &amp; Verifikasi QR',   'Tanda tangan elektronik kepala sekolah pada surat keluar resmi, dilengkapi QR Code terverifikasi untuk keabsahan dokumen.'],
            ['Jadwal Pelajaran',      'Penjadwalan per rombel dan mata pelajaran dengan deteksi bentrok otomatis dan tampilan publik bagi siswa.'],
            ['Laporan &amp; Rekap',       'Laporan kehadiran, rekap jurnal per periode, dan statistik kinerja siap cetak maupun ekspor ke Excel.'],
            ['Buku Tamu Digital',     'Registrasi tamu sekolah secara digital dengan riwayat kunjungan tercatat dan dapat dicetak sebagai laporan periodik.'],
            ['Kuis &amp; Asesmen',        'Pembuatan soal kuis digital dan pengumpulan tugas siswa terintegrasi dalam satu alur pembelajaran.',],
            ['Capaian Pembelajaran',  'Dokumentasi Capaian Pembelajaran (CP) per mata pelajaran dan portofolio tugas digital siswa yang terstruktur.'],
            ['Backup &amp; Restore',      'Cadangan dan pemulihan database langsung dari dashboard administrator tanpa memerlukan akses teknis ke server.'],
        ];

        $ftTbl = $sec->addTable('tblFeat');
        foreach (array_chunk($features, 2) as $pair) {
            $fRow = $ftTbl->addRow();
            foreach ($pair as [$title, $desc]) {
                $fc = $fRow->addCell(Converter::cmToTwip(8));
                $fc->addText($title, 'h3', ['spaceAfter' => 40, 'spaceBefore' => 0]);
                $fc->addText($desc, 'muted', 'pBodySm');
            }
            if (count($pair) < 2) {
                $fRow->addCell(Converter::cmToTwip(8));
            }
        }
        $sec->addTextBreak(1);

        // ── 04. PAKET &amp; HARGA ───────────────────────────────────────
        $this->sectionHead($sec, '04  PAKET &amp; HARGA', 'Pilih Paket yang Sesuai dengan Kebutuhan');

        $sec->addText(
            'Tersedia dua skema pembayaran: lisensi tahunan (berlangganan) atau lisensi selamanya (pembelian sekali bayar). '
            . 'Semua paket sudah termasuk instalasi awal, konfigurasi data, dan panduan penggunaan.',
            'body', 'pBody'
        );
        $sec->addTextBreak(1);

        // Pricing table
        $prTbl = $sec->addTable('tblPrice');

        // Header row
        $packages = ['Starter', 'Profesional', 'Enterprise'];
        $pkgBg    = [self::C_INDIGO, '2D3B8E', self::C_NAVY];
        $hRow = $prTbl->addRow(Converter::cmToTwip(0.9));
        $hRow->addCell(Converter::cmToTwip(4.8), ['bgColor' => self::C_NAVY])
             ->addText('', 'pHead', 'pNoSp');
        foreach (array_combine($packages, $pkgBg) as $pkg => $bg) {
            $hRow->addCell(Converter::cmToTwip(3.9), ['bgColor' => $bg])
                 ->addText($pkg, 'pHead', 'pCenter');
        }

        // Price row
        $prices = ['Rp 3.500.000/thn', 'Rp 7.500.000/thn', 'Rp 13.500.000/thn'];
        $prRow  = $prTbl->addRow(Converter::cmToTwip(1.0));
        $prRow->addCell(Converter::cmToTwip(4.8), ['bgColor' => self::C_LIGHT])
              ->addText('Harga Berlangganan', 'h3', 'pNoSp');
        $bgsLight = [self::C_LIGHT, 'E8EAFB', self::C_LIGHT];
        foreach (array_combine($prices, $bgsLight) as $price => $bg) {
            $prRow->addCell(Converter::cmToTwip(3.9), ['bgColor' => $bg, 'vAlign' => 'center'])
                  ->addText($price, 'pPrice', 'pCenter');
        }

        // One-time row
        $oneTime = ['Rp 8.500.000', 'Rp 16.500.000', 'Rp 28.000.000'];
        $otRow   = $prTbl->addRow();
        $otRow->addCell(Converter::cmToTwip(4.8))->addText('Harga Sekali Bayar', 'body', 'pNoSp');
        foreach (array_combine($oneTime, $bgsLight) as $price => $bg) {
            $otRow->addCell(Converter::cmToTwip(3.9), ['bgColor' => $bg])
                  ->addText($price, ['name' => 'Calibri', 'size' => 10, 'bold' => true, 'color' => self::C_NAVY], 'pCenter');
        }

        // Feature rows
        $featureRows = [
            ['Pengguna Aktif',         'Maks. 50',        'Maks. 200',          'Tidak terbatas'],
            ['Modul Dasar (4 modul)',  'Ya',              'Ya',                 'Ya'],
            ['Modul Lengkap (12+)',    'Tidak',           'Ya',                 'Ya'],
            ['Surat &amp; TTE / QR',       'Tidak',           'Ya',                 'Ya'],
            ['KPI &amp; Evaluasi',         'Tidak',           'Ya',                 'Ya'],
            ['Kustomisasi Branding',   'Tidak',           'Tidak',              'Logo &amp; warna'],
            ['Modul Kustom',           'Tidak',           'Tidak',              '2 modul'],
            ['Layanan Dukungan',       'Email 5x8 jam',   'WA + Email 5x10 jam','Prioritas 7x12 jam'],
            ['SLA Respons',            'Maks. 2 hari kerja','Maks. 1 hari kerja','Maks. 4 jam'],
            ['Training Onboarding',    'Tidak',           '1 hari',             '2 hari'],
            ['Update Sistem',          'Minor 1 tahun',   'Minor+Major 1 tahun','Selama berlangganan'],
        ];

        $yesNo = ['Ya' => 'checkY', 'Tidak' => 'checkN'];
        foreach ($featureRows as $ri => [$label, $s, $p, $e]) {
            $bg  = $ri % 2 === 0 ? self::C_WHITE : 'F8FAFF';
            $bgP = $ri % 2 === 0 ? 'EEF0FA' : 'E4E7F7';
            $fr  = $prTbl->addRow();
            $fr->addCell(Converter::cmToTwip(4.8), ['bgColor' => $bg])->addText($label, 'body', 'pNoSp');
            foreach ([[$s, $bg], [$p, $bgP], [$e, $bg]] as [$val, $cellBg]) {
                $fStyle = $yesNo[$val] ?? 'body';
                $fr->addCell(Converter::cmToTwip(3.9), ['bgColor' => $cellBg])
                   ->addText($val, $fStyle, 'pCenter');
            }
        }

        $sec->addTextBreak(1);
        $sec->addText(
            'Catatan: Harga di atas belum termasuk biaya hosting/server. '
            . 'Tim kami dapat merekomendasikan provider hosting yang optimal, atau membantu konfigurasi di server sekolah yang sudah tersedia.',
            'muted', 'pBodySm'
        );
        $sec->addTextBreak(1);

        // ── 05. IMPLEMENTASI ────────────────────────────────────────
        $this->sectionHead($sec, '05  IMPLEMENTASI', 'Alur &amp; Tahapan Pengerjaan');

        $sec->addText(
            'Estimasi total waktu implementasi adalah 7 hingga 14 hari kerja, tergantung paket yang dipilih '
            . 'dan kesiapan data awal dari institusi. Seluruh proses didampingi oleh tim teknis kami.',
            'body', 'pBody'
        );
        $sec->addTextBreak(1);

        $steps = [
            ['01', 'Analisis Kebutuhan',       '1 - 2 hari kerja',
             'Diskusi mendalam untuk memahami alur kerja sekolah: identifikasi peran pengguna, struktur rombel, jadwal, dan kebutuhan kustomisasi awal.'],
            ['02', 'Setup &amp; Instalasi',         '1 - 3 hari kerja',
             'Konfigurasi server atau hosting, instalasi aplikasi, migrasi database awal, serta pengaturan domain dan SSL.'],
            ['03', 'Konfigurasi Data Awal',     '2 - 3 hari kerja',
             'Input data master: guru, siswa, rombel, mata pelajaran, jadwal, dan konfigurasi sistem sesuai struktur organisasi sekolah.'],
            ['04', 'Training &amp; Onboarding',     '1 - 2 hari kerja',
             'Pelatihan penggunaan platform untuk admin sekolah, guru, dan staf tata usaha. Tersedia modul panduan digital dan video tutorial.'],
            ['05', 'Go-Live &amp; Pendampingan',    '3 - 5 hari kerja',
             'Sistem mulai digunakan aktif dengan pendampingan penuh oleh tim kami selama minggu pertama operasional.'],
        ];

        $stTbl = $sec->addTable('tblMain');
        foreach ($steps as [$no, $title, $dur, $desc]) {
            $sr = $stTbl->addRow();
            $nc = $sr->addCell(Converter::cmToTwip(1.0), ['bgColor' => self::C_INDIGO, 'vAlign' => 'center']);
            $nc->addText($no, ['name' => 'Calibri', 'size' => 11, 'bold' => true, 'color' => self::C_WHITE], 'pCenter');
            $tc = $sr->addCell(Converter::cmToTwip(8.5));
            $tc->addText($title, 'h3', ['spaceAfter' => 30, 'spaceBefore' => 0]);
            $tc->addText($desc, 'muted', 'pNoSp');
            $dc = $sr->addCell(Converter::cmToTwip(6.5), ['bgColor' => self::C_LIGHT, 'vAlign' => 'center']);
            $dc->addText($dur, ['name' => 'Calibri', 'size' => 9, 'bold' => true, 'color' => self::C_TEAL], 'pCenter');
        }
        $sec->addTextBreak(1);

        // ── 06. GARANSI &amp; DUKUNGAN ─────────────────────────────────
        $this->sectionHead($sec, '06  GARANSI &amp; DUKUNGAN', 'Komitmen Kami Setelah Implementasi');

        $guarantees = [
            'Garansi perbaikan bug selama 30 hari pertama setelah go-live tanpa biaya tambahan.',
            'Update keamanan (security patch) diberikan secara gratis sepanjang masa berlangganan.',
            'Dokumentasi teknis dan panduan pengguna disediakan dalam format digital yang dapat dicetak.',
            'Saluran komunikasi dukungan melalui WhatsApp, email, dan ticket sistem — sesuai paket.',
            'Data backup otomatis dapat dikonfigurasi dengan fitur Backup &amp; Restore bawaan sistem.',
        ];
        foreach ($guarantees as $g) {
            $sec->addText('*  ' . $g, 'body', 'pBullet');
        }
        $sec->addTextBreak(1);

        // ── 07. SYARAT &amp; KETENTUAN ─────────────────────────────────
        $this->sectionHead($sec, '07  SYARAT &amp; KETENTUAN', 'Hal-hal yang Perlu Diperhatikan');

        $terms = [
            'Pembayaran pertama dilakukan di muka (down payment minimal 50%) sebelum proses instalasi dimulai.',
            'Harga yang tercantum belum termasuk biaya hosting/server dan nama domain.',
            'Lisensi yang diperoleh bersifat eksklusif untuk satu institusi/sekolah.',
            'Modifikasi kode sumber (source code) tanpa izin tertulis dari pengembang tidak diperkenankan.',
            'Proposal ini berlaku hingga 31 Agustus 2026. Perpanjangan dapat dilakukan atas persetujuan kedua pihak.',
            'Pengembang berhak merevisi harga dengan pemberitahuan tertulis minimal 14 hari sebelumnya.',
        ];
        foreach ($terms as $t) {
            $sec->addText('*  ' . $t, 'body', 'pBullet');
        }
        $sec->addTextBreak(2);

        // ── 08. PENUTUP ─────────────────────────────────────────────
        $this->sectionHead($sec, '08  PENUTUP', 'Undangan untuk Berkolaborasi');

        $sec->addText(
            'Kami percaya bahwa teknologi yang tepat dapat membantu sekolah Anda beroperasi lebih efisien, '
            . 'transparan, dan modern. APIKMAS DJurnal siap menjadi mitra digital jangka panjang untuk kemajuan institusi pendidikan Anda.',
            'body', 'pBody'
        );
        $sec->addText(
            'Konsultasi kebutuhan, sesi demonstrasi, dan diskusi penyesuaian paket tersedia gratis '
            . 'tanpa kewajiban apapun. Kami terbuka untuk negosiasi dan kustomisasi sesuai anggaran institusi.',
            'body', 'pBody'
        );
        $sec->addTextBreak(1);

        // Contact block
        $ctTbl = $sec->addTable('tblMain');
        $ctRow = $ctTbl->addRow(Converter::cmToTwip(1.5));
        foreach ([
            ['WhatsApp', '+62 857-4985-0763'],
            ['Email',    'smkkurikulum3@gmail.com'],
            ['Layanan',  'Senin - Sabtu, 08.00 - 16.00 WIB'],
        ] as [$lbl, $val]) {
            $cc = $ctRow->addCell(Converter::cmToTwip(5.5), ['bgColor' => self::C_NAVY, 'vAlign' => 'center']);
            $cc->addText($lbl, 'ctaLbl', ['spaceAfter' => 30, 'spaceBefore' => 0]);
            $cc->addText($val, 'ctaVal', 'pNoSp');
        }
        $sec->addTextBreak(3);

        // ── TANDA TANGAN ────────────────────────────────────────────
        $sigTbl = $sec->addTable('tblSig');
        $sigRow = $sigTbl->addRow(Converter::cmToTwip(3.5));

        $left = $sigRow->addCell(Converter::cmToTwip(8));
        $left->addText('Hormat kami,', 'sigRole', 'pNoSp');
        $left->addTextBreak(3);
        $left->addText('_______________________________', 'muted', 'pNoSp');
        $left->addText('Tim APIKMAS DJurnal',             'sigName', 'pNoSp');
        $left->addText('Pengembang &amp; Pengelola Platform',  'sigRole', 'pNoSp');
        $left->addText('Tanggal: ______________________', 'muted', ['spaceAfter' => 0, 'spaceBefore' => 60]);

        $right = $sigRow->addCell(Converter::cmToTwip(8));
        $right->addText('Mengetahui dan Menyetujui,', 'sigRole', 'pNoSp');
        $right->addTextBreak(3);
        $right->addText('_______________________________', 'muted', 'pNoSp');
        $right->addText('Kepala Sekolah / Pimpinan',       'sigName', 'pNoSp');
        $right->addText('Nama: ________________________',  'sigRole', 'pNoSp');
        $right->addText('Tanggal: ______________________', 'muted', ['spaceAfter' => 0, 'spaceBefore' => 60]);

        // ── Stream response (Laravel-safe) ─────────────────────────
        $filename = 'Proposal_APIKMAS_DJurnal_' . now()->format('Y-m-d') . '.docx';
        $writer   = IOFactory::createWriter($phpWord, 'Word2007');

        return response()->streamDownload(
            function () use ($writer) {
                $writer->save('php://output');
            },
            $filename,
            [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Cache-Control'       => 'max-age=0',
                'Pragma'              => 'public',
            ]
        );
    }

    private function sectionHead(Section $section, string $eyebrow, string $title): void
    {
        $section->addText($eyebrow, 'eyebrow', 'pSection');
        $section->addText($title, 'h2', ['spaceAfter' => 140, 'spaceBefore' => 60]);
    }
}
