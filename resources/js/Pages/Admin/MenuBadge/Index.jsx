import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Tag, Check } from 'lucide-react';
import { useState } from 'react';
import { SIDEBAR_MENU_ITEMS } from '@/Components/Sidebar';

const BADGE_OPTIONS = [
    { value: '',             label: 'Tidak ada' },
    { value: 'beta',         label: 'Beta',         color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
    { value: 'maintenance',  label: 'Maintenance',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    { value: 'pengembangan', label: 'Pengembangan', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
];

export default function MenuBadgeIndex({ badges }) {
    const [local,   setLocal]   = useState(() => ({ ...badges }));
    const [saving,  setSaving]  = useState(null);
    const [saved,   setSaved]   = useState(null);

    const handleChange = (href, value) => {
        setLocal(prev => ({ ...prev, [href]: value || undefined }));
        setSaving(href);
        router.post('/admin/menu-badge', { path: href, badge: value || null }, {
            preserveState: true,
            onSuccess: () => {
                setSaving(null);
                setSaved(href);
                setTimeout(() => setSaved(s => s === href ? null : s), 1500);
            },
            onError: () => setSaving(null),
        });
    };

    // Group by section
    const sections = [...new Set(SIDEBAR_MENU_ITEMS.map(m => m.section))];

    return (
        <AppLayout title="Info Menu">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tag className="h-5 w-5 text-sky-600" /> Info Menu
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Tandai menu yang sedang dalam pengembangan — badge muncul otomatis di sidebar semua pengguna.
                    </p>
                </div>

                <div className="space-y-4">
                    {sections.map(section => {
                        const items = SIDEBAR_MENU_ITEMS.filter(m => m.section === section);
                        return (
                            <Card key={section}>
                                <CardHeader>
                                    <CardTitle className="text-sm">{section}</CardTitle>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left font-medium w-48">Menu</th>
                                                <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell text-gray-400">Path</th>
                                                <th className="px-4 py-2.5 text-left font-medium w-52">Status Badge</th>
                                                <th className="px-4 py-2.5 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {items.map(menu => {
                                                const current = local[menu.href] ?? '';
                                                const isSaving = saving === menu.href;
                                                const isSaved  = saved  === menu.href;
                                                return (
                                                    <tr key={menu.href} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                                                            {menu.label}
                                                        </td>
                                                        <td className="px-4 py-2.5 hidden sm:table-cell">
                                                            <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">{menu.href}</code>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <select
                                                                value={current}
                                                                onChange={e => handleChange(menu.href, e.target.value)}
                                                                disabled={isSaving}
                                                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                                                            >
                                                                {BADGE_OPTIONS.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                            {current && (
                                                                <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_OPTIONS.find(o => o.value === current)?.color ?? ''}`}>
                                                                    {BADGE_OPTIONS.find(o => o.value === current)?.label}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            {isSaving && (
                                                                <span className="text-xs text-gray-400 animate-pulse">Menyimpan…</span>
                                                            )}
                                                            {isSaved && !isSaving && (
                                                                <Check className="h-4 w-4 text-emerald-500 inline" />
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
