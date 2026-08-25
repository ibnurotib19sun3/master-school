import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import {
    Bold, Italic, UnderlineIcon, Strikethrough,
    Heading2, Heading3, List, ListOrdered,
    Quote, Minus, RotateCcw, RotateCw, Code,
} from 'lucide-react';

// Toolbar button
function ToolBtn({ onClick, active, title, children }) {
    return (
        <button type="button" title={title} onClick={onClick}
            className={`p-1.5 rounded-md transition-colors text-sm leading-none ${
                active
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
            }`}>
            {children}
        </button>
    );
}

function Divider() {
    return <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 self-center" />;
}

export default function RichEditor({ label, value = '', onChange, error, placeholder = 'Tulis di sini...' }) {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2.5 text-gray-800 dark:text-gray-200',
            },
        },
        onUpdate({ editor: e }) {
            const html = e.isEmpty ? '' : e.getHTML();
            onChange?.(html);
        },
    });

    // Sync external value changes (e.g. when form resets)
    useEffect(() => {
        if (!editor) return;
        const current = editor.isEmpty ? '' : editor.getHTML();
        if (value !== current) {
            editor.commands.setContent(value || '', false);
        }
    // Only run when value prop changes to empty (form reset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value === '' ? '' : null]);

    if (!editor) return null;

    const e = editor;

    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}

            <div className={`rounded-xl border bg-white dark:bg-gray-900 overflow-hidden transition-colors ${
                error
                    ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400/40'
                    : 'border-gray-300 dark:border-gray-600 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-500/30'
            }`}>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 dark:border-gray-700/70 bg-gray-50 dark:bg-gray-800/60">
                    <ToolBtn onClick={() => e.chain().focus().toggleBold().run()} active={e.isActive('bold')} title="Bold (Ctrl+B)">
                        <Bold className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleItalic().run()} active={e.isActive('italic')} title="Italic (Ctrl+I)">
                        <Italic className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleUnderline().run()} active={e.isActive('underline')} title="Underline (Ctrl+U)">
                        <UnderlineIcon className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleStrike().run()} active={e.isActive('strike')} title="Strikethrough">
                        <Strikethrough className="h-3.5 w-3.5" />
                    </ToolBtn>

                    <Divider />

                    <ToolBtn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive('heading', { level: 2 })} title="Heading 2">
                        <Heading2 className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} active={e.isActive('heading', { level: 3 })} title="Heading 3">
                        <Heading3 className="h-3.5 w-3.5" />
                    </ToolBtn>

                    <Divider />

                    <ToolBtn onClick={() => e.chain().focus().toggleBulletList().run()} active={e.isActive('bulletList')} title="Bullet List">
                        <List className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive('orderedList')} title="Ordered List">
                        <ListOrdered className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive('blockquote')} title="Kutipan">
                        <Quote className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().toggleCode().run()} active={e.isActive('code')} title="Kode">
                        <Code className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().setHorizontalRule().run()} title="Garis Pemisah">
                        <Minus className="h-3.5 w-3.5" />
                    </ToolBtn>

                    <Divider />

                    <ToolBtn onClick={() => e.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
                        <RotateCcw className="h-3.5 w-3.5" />
                    </ToolBtn>
                    <ToolBtn onClick={() => e.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
                        <RotateCw className="h-3.5 w-3.5" />
                    </ToolBtn>
                </div>

                {/* Editor area with placeholder */}
                <div className="relative">
                    {e.isEmpty && (
                        <span className="absolute top-2.5 left-3 text-sm text-gray-400 pointer-events-none select-none">
                            {placeholder}
                        </span>
                    )}
                    <EditorContent editor={editor} />
                </div>
            </div>

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}
