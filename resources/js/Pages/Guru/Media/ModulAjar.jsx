import MediaFilePage from './_MediaFilePage';
import { BookMarked } from 'lucide-react';

export default function ModulAjarPage({ items, mataPelajaran, guruList, isAdmin, filters }) {
    return (
        <MediaFilePage
            title="Modul Ajar"
            storeUrl="/guru/modul-ajar"
            destroyUrlPrefix="/guru/modul-ajar"
            filterUrl="/guru/modul-ajar"
            acceptMimes=".pdf,.doc,.docx"
            acceptLabel="PDF, DOC, DOCX"
            icon={BookMarked}
            items={items}
            mataPelajaran={mataPelajaran}
            guruList={guruList}
            isAdmin={isAdmin}
            filters={filters}
        />
    );
}
