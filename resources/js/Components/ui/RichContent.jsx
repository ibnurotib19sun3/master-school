export default function RichContent({ html, className = '' }) {
    if (!html) return null;
    return (
        <div
            className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
