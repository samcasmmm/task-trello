'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading3,
  Heading4,
  RemoveFormatting,
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function WysiwygEditor({
  value,
  onChange,
  placeholder = 'Write something here...',
  minHeight = '140px',
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Sync initial value only once to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    setIsMounted(true);
  }, []);

  // Format helper
  const executeCommand = (command: string, arg: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, arg);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-800 rounded bg-slate-950 text-slate-100 overflow-hidden flex flex-col focus-within:border-slate-700 transition-colors">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border-b border-slate-800 select-none">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('bold')}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('italic')}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('underline')}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('strikeThrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('formatBlock', '<h3>')}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('formatBlock', '<h4>')}
          title="Heading 4"
        >
          <Heading4 className="h-3.5 w-3.5" />
        </Button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-slate-800 hover:text-white"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor Content editable */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 outline-none overflow-y-auto text-sm prose prose-invert max-w-none text-slate-200"
        style={{ minHeight }}
        placeholder={placeholder}
      />

      {/* Tailwind contentEditable placeholder fallback styling */}
      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #475569;
          cursor: text;
        }
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1.25rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .prose h3 {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.25rem !important;
          color: #f8fafc !important;
        }
        .prose h4 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.25rem !important;
          color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
