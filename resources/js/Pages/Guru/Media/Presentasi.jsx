import MediaFilePage from './_MediaFilePage';
import { Presentation } from 'lucide-react';

export default function PresentasiPage({ items, mataPelajaran, guruList, isAdmin, filters }) {
    return (
        <MediaFilePage
            title="Presentasi"
            storeUrl="/guru/presentasi"
            destroyUrlPrefix="/guru/presentasi"
            filterUrl="/guru/presentasi"
            acceptMimes=".pptx,.ppt,.pdf"
            acceptLabel="PPTX, PPT, PDF"
            icon={Presentation}
            items={items}
            mataPelajaran={mataPelajaran}
            guruList={guruList}
            isAdmin={isAdmin}
            filters={filters}
        />
    );
}
