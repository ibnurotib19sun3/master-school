import MediaFilePage from './_MediaFilePage';
import { FileSpreadsheet } from 'lucide-react';

export default function JobsheetPage({ items, mataPelajaran, guruList, isAdmin, filters }) {
    return (
        <MediaFilePage
            title="Jobsheet"
            storeUrl="/guru/jobsheet"
            destroyUrlPrefix="/guru/jobsheet"
            filterUrl="/guru/jobsheet"
            acceptMimes=".pdf,.doc,.docx,.xlsx,.xlsm"
            acceptLabel="PDF, DOC, DOCX, XLSX, XLSM"
            icon={FileSpreadsheet}
            items={items}
            mataPelajaran={mataPelajaran}
            guruList={guruList}
            isAdmin={isAdmin}
            filters={filters}
        />
    );
}
