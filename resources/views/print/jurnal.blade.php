<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cetak Jurnal — {{ $jabatan }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
    font-size: 11pt;
    color: #111;
    background: #f0f0f0;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 20px auto;
    background: #fff;
    padding: 20mm 20mm 20mm 25mm;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    position: relative;
  }

  /* ── KOP SURAT ── */
  .kop {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 10px;
    border-bottom: 3px solid #111;
    margin-bottom: 4px;
  }
  .kop-logo {
    width: 70px;
    height: 70px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .kop-logo-placeholder {
    width: 70px;
    height: 70px;
    border: 2px dashed #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9pt;
    color: #aaa;
    flex-shrink: 0;
  }
  .kop-text {
    flex: 1;
    text-align: center;
  }
  .kop-yayasan {
    font-size: 10pt;
    color: #555;
    letter-spacing: 0.5px;
  }
  .kop-nama {
    font-size: 18pt;
    font-weight: 900;
    color: #111;
    line-height: 1.1;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .kop-alamat {
    font-size: 9pt;
    color: #555;
    margin-top: 2px;
  }
  .kop-kontak {
    font-size: 8.5pt;
    color: #777;
  }
  .kop-divider {
    height: 1.5px;
    background: #c8a951;
    margin-top: 2px;
    margin-bottom: 16px;
  }

  /* ── JUDUL DOKUMEN ── */
  .doc-title {
    text-align: center;
    margin: 4px 0 18px;
  }
  .doc-title h2 {
    font-size: 14pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #111;
  }
  .doc-title p {
    font-size: 10pt;
    color: #555;
    margin-top: 2px;
  }
  .doc-title .periode {
    display: inline-block;
    margin-top: 4px;
    padding: 2px 14px;
    border: 1px solid #111;
    border-radius: 3px;
    font-size: 9.5pt;
    color: #111;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* ── TABEL ── */
  table.jurnal {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 11pt;
  }
  table.jurnal thead tr {
    background: #111;
    color: #fff;
  }
  table.jurnal thead th {
    padding: 8px 10px;
    text-align: center;
    font-weight: 700;
    font-size: 10.5pt;
    border: 1px solid #111;
  }
  table.jurnal tbody tr:nth-child(even) {
    background: #f5f5f5;
  }
  table.jurnal tbody tr:hover {
    background: #eeeeee;
  }
  table.jurnal td {
    padding: 7px 10px;
    border: 1px solid #ccc;
    vertical-align: top;
    line-height: 1.5;
  }
  table.jurnal td.center { text-align: center; }
  table.jurnal td.no { width: 32px; text-align: center; }
  table.jurnal td.tgl { width: 110px; white-space: nowrap; }
  table.jurnal td.kegiatan { width: auto; }
  table.jurnal td.ket { width: 140px; font-style: italic; color: #555; }

  /* ── TTD ── */
  .ttd-section {
    margin-top: 30px;
    display: flex;
    justify-content: flex-end;
  }
  .ttd-box {
    text-align: center;
    min-width: 180px;
  }
  .ttd-kota {
    font-size: 10.5pt;
    margin-bottom: 50px;
  }
  .ttd-nama {
    font-size: 11pt;
    font-weight: 700;
    border-top: 1.5px solid #333;
    padding-top: 4px;
  }
  .ttd-jabatan {
    font-size: 9.5pt;
    color: #666;
  }

  /* ── FOOTER ── */
  .doc-footer {
    position: absolute;
    bottom: 12mm;
    left: 25mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #aaa;
    border-top: 1px solid #e0e0e0;
    padding-top: 4px;
  }

  /* ── INFO PEGAWAI ── */
  .info-pegawai {
    display: flex;
    gap: 32px;
    margin-bottom: 14px;
    font-size: 10.5pt;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 14px;
  }
  .info-pegawai .label { color: #666; min-width: 80px; }
  .info-pegawai .value { font-weight: 600; color: #111; }

  /* ── PRINT MEDIA ── */
  @media print {
    body { background: none; }
    .page {
      margin: 0;
      box-shadow: none;
      padding: 15mm 18mm 20mm 22mm;
    }
    .no-print { display: none !important; }
  }

  /* ── ACTIONS (screen only) ── */
  .actions {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 100;
  }
  .btn-print {
    background: #111;
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(26,58,107,0.25);
    transition: background 0.15s;
  }
  .btn-print:hover { background: #0f2550; }
  .btn-close {
    background: #fff;
    color: #555;
    border: 1px solid #ccc;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
  }
</style>
</head>
<body>

<!-- Action buttons (screen only) -->
<div class="actions no-print">
  <button class="btn-close" onclick="window.close()">✕ Tutup</button>
  <button class="btn-print" onclick="window.print()">🖨 Cetak</button>
</div>

<div class="page">

  <!-- KOP SURAT -->
  <div class="kop">
    @if($sekolah->logo_url)
      <img src="{{ $sekolah->logo_url }}" class="kop-logo" alt="Logo">
    @else
      <div class="kop-logo-placeholder">LOGO</div>
    @endif
    <div class="kop-text">
      @if($sekolah->yayasan_dinas)
        <p class="kop-yayasan">{{ strtoupper($sekolah->yayasan_dinas) }}</p>
      @endif
      <p class="kop-nama">{{ $sekolah->nama_sekolah ?? 'NAMA SEKOLAH' }}</p>
      @if($sekolah->alamat)
        <p class="kop-alamat">{{ $sekolah->alamat }}{{ $sekolah->kecamatan ? ', ' . $sekolah->kecamatan : '' }}{{ $sekolah->kota ? ', ' . $sekolah->kota : '' }}</p>
      @endif
      <p class="kop-kontak">
        @if($sekolah->telepon) Telp: {{ $sekolah->telepon }}@endif
        @if($sekolah->email_sekolah) &nbsp;|&nbsp; Email: {{ $sekolah->email_sekolah }}@endif
        @if($sekolah->website) &nbsp;|&nbsp; {{ $sekolah->website }}@endif
      </p>
    </div>
  </div>
  <div class="kop-divider"></div>

  <!-- JUDUL -->
  <div class="doc-title">
    <h2>Jurnal {{ $jabatan }}</h2>
    @if($jurnal->isNotEmpty())
      @php
        $tglMin = $jurnal->first()->tanggal;
        $tglMax = $jurnal->last()->tanggal;
        $fmt = fn($d) => \Carbon\Carbon::parse($d)->isoFormat('D MMMM YYYY');
        $periode = $tglMin == $tglMax ? $fmt($tglMin) : $fmt($tglMin) . ' — ' . $fmt($tglMax);
      @endphp
      <p class="periode">{{ $periode }}</p>
    @endif
  </div>

  <!-- INFO PEGAWAI -->
  <div class="info-pegawai">
    <div>
      <span class="label">Nama</span>&ensp;:&ensp;<span class="value">{{ $nama }}</span>
    </div>
    <div>
      <span class="label">Jabatan</span>&ensp;:&ensp;<span class="value">{{ $jabatan }}</span>
    </div>
    @if($jurnal->first()?->tahunAjaran)
    <div>
      <span class="label">Tahun Ajaran</span>&ensp;:&ensp;
      <span class="value">{{ $jurnal->first()->tahunAjaran->nama }} — Sem {{ $jurnal->first()->semester }}</span>
    </div>
    @endif
  </div>

  <!-- TABEL JURNAL -->
  @if($jurnal->isEmpty())
    <p style="text-align:center; color:#aaa; margin-top:40px;">Tidak ada data jurnal yang dipilih.</p>
  @else
  <table class="jurnal">
    <thead>
      <tr>
        <th style="width:32px">No</th>
        <th style="width:110px">Tanggal</th>
        <th>Kegiatan yang Dilaksanakan</th>
        <th style="width:140px">Keterangan</th>
      </tr>
    </thead>
    <tbody>
      @foreach($jurnal as $i => $item)
      <tr>
        <td class="center">{{ $i + 1 }}</td>
        <td class="tgl">
          {{ \Carbon\Carbon::parse($item->tanggal)->isoFormat('dddd, D MMM YYYY') }}
        </td>
        <td class="kegiatan">{{ $item->kegiatan }}</td>
        <td class="ket">{{ $item->keterangan ?: '—' }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <!-- TANDA TANGAN -->
  <div class="ttd-section">
    <div class="ttd-box">
      <p class="ttd-kota">
        {{ $sekolah->kota ?? 'Kota' }}, {{ \Carbon\Carbon::now()->isoFormat('D MMMM YYYY') }}
      </p>
      <p class="ttd-nama">{{ $nama }}</p>
      <p class="ttd-jabatan">{{ $jabatan }}</p>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    <span>Dicetak {{ \Carbon\Carbon::now()->isoFormat('D MMM YYYY, HH:mm') }}</span>
    <span>{{ $sekolah->nama_sekolah ?? '' }}</span>
  </div>

</div>

<script>
  // Auto-print after a short delay so the page renders first
  setTimeout(function() { window.print(); }, 600);
</script>
</body>
</html>
