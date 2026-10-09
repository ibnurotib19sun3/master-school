import { chromium } from 'playwright';

const BASE = 'http://master-school.test:8080';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', 'temp.qa.tu8@example.test');
await page.fill('input[type="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle');

// dismiss "Login Berhasil" welcome modal if present
const closeBtn = page.locator('button:has-text("Tutup"), [aria-label="Close"], button:has-text("OK")').first();
if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click().catch(() => {});
}
await page.waitForTimeout(1000);

const bodyText = await page.locator('body').innerText();

const hasSiswaGroup   = bodyText.includes('Siswa');
const hasDokumenSiswa = bodyText.includes('Dokumen Siswa');
const hasDataSiswa    = bodyText.includes('Data Siswa');
const hasJenisDok     = bodyText.includes('Jenis Dokumen');
const hasLaporanDok   = bodyText.includes('Laporan Dokumen');
const hasCetakKartu   = bodyText.includes('Cetak Kartu');

const dokumenSiswaLink = await page.locator('a[href="/tatausaha/dokumen-siswa"]').count();
const dataSiswaLink    = await page.locator('a[href="/admin/siswa"]').count();
const jenisDokLink     = await page.locator('a[href="/admin/dokumen-jenis"]').count();
const laporanDokLink   = await page.locator('a[href="/admin/dokumen-jenis/laporan"]').count();

console.log('Sidebar text contains "Dokumen Siswa":', hasDokumenSiswa);
console.log('Dokumen Siswa link count:', dokumenSiswaLink);
console.log('---');
console.log('Data Siswa link count (should be 0):', dataSiswaLink);
console.log('Jenis Dokumen link count (should be 0):', jenisDokLink);
console.log('Laporan Dokumen link count (should be 0):', laporanDokLink);
console.log('---');
console.log('Tata Usaha group still mentions Dokumen Siswa text at all (debug):', hasDokumenSiswa);

await page.screenshot({ path: 'C:/tmp/siswa_menu_tu8.png', fullPage: true });

await browser.close();
