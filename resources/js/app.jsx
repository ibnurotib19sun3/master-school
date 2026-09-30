import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from '@/contexts/ThemeContext';

const appName = import.meta.env.VITE_APP_NAME || 'APIKMAS Djurnal';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ThemeProvider>
                <App {...props} />
            </ThemeProvider>
        );
    },
    // Progress bar tipis di atas diganti dengan overlay full-screen (GlobalNavigationLoader
    // di AppLayout) yang mem-block klik selama loading — lihat resources/js/Layouts/AppLayout.jsx.
    progress: false,
});
