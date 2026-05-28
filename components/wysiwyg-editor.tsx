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
    <div className="border rounded bg-surface-3 border-border-default text-foreground overflow-hidden flex flex-col focus-within:border-border-strong transition-colors">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-2 border-b border-border-default select-none">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('bold')}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('italic')}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('underline')}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('strikeThrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('formatBlock', '<h3>')}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('formatBlock', '<h4>')}
          title="Heading 4"
        >
          <Heading4 className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-sm hover:bg-surface-3 hover:text-foreground"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        className="p-3 outline-none overflow-y-auto text-sm text-foreground-muted max-w-none 
          empty:before:content-[attr(placeholder)] empty:before:text-(--foreground-dim)/50 empty:before:cursor-text
          *:list-inside *:mt-2 *:mb-2
          ul:list-disc ul:pl-5 
          ol:list-decimal ol:pl-5 
          h3:text-lg h3:font-semibold h3:mt-3 h3:mb-1 h3:text-foreground 
          h4:text-base h4:font-semibold h4:mt-2 h4:mb-1 h4:text-foreground-muted"
        {...(placeholder ? { placeholder } : {})}
      />
    </div>
  );
}
