'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

interface MentionMember {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  members?: MentionMember[];
}

export default function WysiwygEditor({
  value,
  onChange,
  placeholder = 'Write something here...',
  minHeight = '140px',
  members = [],
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Mention state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const mentionStartRef = useRef<number | null>(null);

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
    detectMention();
  };

  // Detect @ mention trigger
  const detectMention = useCallback(() => {
    if (!editorRef.current || members.length === 0) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) {
      setShowMentionDropdown(false);
      return;
    }

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Find the last @ before cursor that's not inside a mention span
    let atIndex = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '@') {
        atIndex = i;
        break;
      }
      // Stop if we hit a space or newline before finding @
      if (text[i] === ' ' && i < cursorPos - 1 && text.substring(i + 1, cursorPos).includes(' ')) {
        break;
      }
    }

    if (atIndex === -1) {
      setShowMentionDropdown(false);
      return;
    }

    // Check if the @ is at start of text or preceded by a space/newline
    if (
      atIndex > 0 &&
      text[atIndex - 1] !== ' ' &&
      text[atIndex - 1] !== '\n' &&
      text[atIndex - 1] !== '\u00A0'
    ) {
      setShowMentionDropdown(false);
      return;
    }

    // Check if parent is already a mention span
    const parentElement = textNode.parentElement;
    if (parentElement && parentElement.hasAttribute('data-mention-id')) {
      setShowMentionDropdown(false);
      return;
    }

    const query = text.substring(atIndex + 1, cursorPos).toLowerCase();
    mentionStartRef.current = atIndex;
    setMentionQuery(query);
    setSelectedMentionIndex(0);

    // Get position for dropdown
    const tempRange = document.createRange();
    tempRange.setStart(textNode, atIndex);
    tempRange.setEnd(textNode, atIndex + 1);
    const rect = tempRange.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();

    setMentionPosition({
      top: rect.bottom - editorRect.top + 4,
      left: rect.left - editorRect.left,
    });

    setShowMentionDropdown(true);
  }, [members]);

  // Filter members by mention query
  const filteredMembers = members.filter(
    (m) =>
      m.fullName?.toLowerCase().includes(mentionQuery) ||
      m.email?.toLowerCase().includes(mentionQuery),
  );

  // Insert mention
  const insertMention = useCallback(
    (member: MentionMember) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType !== Node.TEXT_NODE || mentionStartRef.current === null) return;

      const text = textNode.textContent || '';
      const cursorPos = range.startOffset;
      const atIndex = mentionStartRef.current;

      // Create the mention span
      const mentionSpan = document.createElement('span');
      mentionSpan.setAttribute('data-mention-id', member.userId);
      mentionSpan.setAttribute('contenteditable', 'false');
      mentionSpan.className =
        'inline-flex items-center px-1 py-0 rounded text-[11px] font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30 mx-0.5 cursor-default select-none';
      mentionSpan.textContent = `@${member.fullName}`;

      // Split the text node
      const beforeText = text.substring(0, atIndex);
      const afterText = text.substring(cursorPos);

      // Create text nodes
      const beforeNode = document.createTextNode(beforeText);
      const afterNode = document.createTextNode('\u00A0' + afterText);

      // Replace the text node
      const parent = textNode.parentNode;
      if (parent) {
        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(mentionSpan, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);

        // Set cursor after the mention
        const newRange = document.createRange();
        newRange.setStart(afterNode, 1);
        newRange.setEnd(afterNode, 1);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      setShowMentionDropdown(false);
      mentionStartRef.current = null;

      // Notify parent of change
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange],
  );

  // Handle keyboard in mention dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentionDropdown || filteredMembers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredMembers[selectedMentionIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="border rounded bg-surface-3 border-border-default text-foreground overflow-hidden flex flex-col focus-within:border-border-strong transition-colors relative">
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

        {members.length > 0 && (
          <>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <span className="text-[10px] text-foreground-dim/60 px-1 select-none">
              Type @ to mention
            </span>
          </>
        )}
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
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

        {/* Mention Dropdown */}
        {showMentionDropdown && filteredMembers.length > 0 && (
          <div
            ref={mentionDropdownRef}
            className="absolute z-50 w-64 max-h-48 overflow-y-auto rounded-lg border bg-surface-2 border-border-default shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              top: `${mentionPosition.top}px`,
              left: `${Math.max(0, mentionPosition.left)}px`,
            }}
          >
            <div className="p-1">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-dim/60">
                Workspace Members
              </div>
              {filteredMembers.map((member, idx) => (
                <button
                  key={member.userId}
                  type="button"
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors ${
                    idx === selectedMentionIndex
                      ? 'bg-surface-3 text-foreground'
                      : 'text-foreground-muted hover:bg-surface-3/50'
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(member);
                  }}
                  onMouseEnter={() => setSelectedMentionIndex(idx)}
                >
                  <div className="h-6 w-6 rounded-full bg-surface-1 border border-border-subtle flex items-center justify-center text-[10px] font-bold text-foreground-dim shrink-0 overflow-hidden">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      member.fullName?.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{member.fullName}</div>
                    <div className="text-[10px] text-foreground-dim truncate">{member.email}</div>
                  </div>
                  {member.role && (
                    <span className="text-[9px] font-medium text-foreground-dim/60 capitalize shrink-0">
                      {member.role}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {showMentionDropdown && filteredMembers.length === 0 && mentionQuery && (
          <div
            ref={mentionDropdownRef}
            className="absolute z-50 w-64 rounded-lg border bg-surface-2 border-border-default shadow-xl"
            style={{
              top: `${mentionPosition.top}px`,
              left: `${Math.max(0, mentionPosition.left)}px`,
            }}
          >
            <div className="p-3 text-center text-xs text-foreground-dim/60">
              No members found matching &quot;{mentionQuery}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
