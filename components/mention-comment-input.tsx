'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MentionMember {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface MentionCommentInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  members: MentionMember[];
}

/**
 * A simple mention-aware comment input using contentEditable.
 * Supports @mention autocomplete with a dropdown showing workspace/project members.
 */
export default function MentionCommentInput({
  value,
  onChange,
  placeholder = 'Write a comment... Use @ to mention someone',
  members = [],
}: MentionCommentInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const mentionStartRef = useRef<number | null>(null);

  // Sync initial value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    detectMention();
  };

  const detectMention = useCallback(() => {
    if (!editorRef.current || members.length === 0) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) {
      setShowDropdown(false);
      return;
    }

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;

    let atIndex = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === '@') {
        atIndex = i;
        break;
      }
      if (text[i] === ' ' && i < cursorPos - 1 && text.substring(i + 1, cursorPos).includes(' ')) {
        break;
      }
    }

    if (atIndex === -1) {
      setShowDropdown(false);
      return;
    }

    if (
      atIndex > 0 &&
      text[atIndex - 1] !== ' ' &&
      text[atIndex - 1] !== '\n' &&
      text[atIndex - 1] !== '\u00A0'
    ) {
      setShowDropdown(false);
      return;
    }

    const parentElement = textNode.parentElement;
    if (parentElement && parentElement.hasAttribute('data-mention-id')) {
      setShowDropdown(false);
      return;
    }

    const query = text.substring(atIndex + 1, cursorPos).toLowerCase();
    mentionStartRef.current = atIndex;
    setMentionQuery(query);
    setSelectedIdx(0);

    const tempRange = document.createRange();
    tempRange.setStart(textNode, atIndex);
    tempRange.setEnd(textNode, atIndex + 1);
    const rect = tempRange.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();

    setDropdownPos({
      top: rect.bottom - editorRect.top + 4,
      left: rect.left - editorRect.left,
    });

    setShowDropdown(true);
  }, [members]);

  const filteredMembers = members.filter(
    (m) =>
      m.fullName?.toLowerCase().includes(mentionQuery) ||
      m.email?.toLowerCase().includes(mentionQuery),
  );

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

      const mentionSpan = document.createElement('span');
      mentionSpan.setAttribute('data-mention-id', member.userId);
      mentionSpan.setAttribute('contenteditable', 'false');
      mentionSpan.className =
        'inline-flex items-center px-1 py-0 rounded text-[11px] font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30 mx-0.5 cursor-default select-none';
      mentionSpan.textContent = `@${member.fullName}`;

      const beforeText = text.substring(0, atIndex);
      const afterText = text.substring(cursorPos);

      const beforeNode = document.createTextNode(beforeText);
      const afterNode = document.createTextNode('\u00A0' + afterText);

      const parent = textNode.parentNode;
      if (parent) {
        parent.insertBefore(beforeNode, textNode);
        parent.insertBefore(mentionSpan, textNode);
        parent.insertBefore(afterNode, textNode);
        parent.removeChild(textNode);

        const newRange = document.createRange();
        newRange.setStart(afterNode, 1);
        newRange.setEnd(afterNode, 1);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      setShowDropdown(false);
      mentionStartRef.current = null;

      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredMembers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredMembers[selectedIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Method to clear content (called by parent after submit)
  const isEmpty = !value || value === '' || value === '<br>' || value === '<div><br></div>';

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="min-h-[72px] max-h-40 overflow-y-auto p-2.5 rounded-md text-xs text-foreground-muted bg-surface-3 border border-border-default focus:outline-none focus:border-border-strong transition-colors
          empty:before:content-[attr(data-placeholder)] empty:before:text-foreground-dim/40 empty:before:cursor-text empty:before:pointer-events-none"
      />

      {/* Mention Dropdown */}
      {showDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-60 max-h-44 overflow-y-auto rounded-lg border bg-surface-2 border-border-default shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            bottom: '100%',
            left: `${Math.max(0, dropdownPos.left)}px`,
            marginBottom: '4px',
          }}
        >
          <div className="p-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground-dim/60">
              Mention a member
            </div>
            {filteredMembers.map((member, idx) => (
              <button
                key={member.userId}
                type="button"
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
                  idx === selectedIdx
                    ? 'bg-surface-3 text-foreground'
                    : 'text-foreground-muted hover:bg-surface-3/50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(member);
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <div className="h-5 w-5 rounded-full bg-surface-1 border border-border-subtle flex items-center justify-center text-[9px] font-bold text-foreground-dim shrink-0 overflow-hidden">
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
              </button>
            ))}
          </div>
        </div>
      )}

      {showDropdown && filteredMembers.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-60 rounded-lg border bg-surface-2 border-border-default shadow-xl"
          style={{
            bottom: '100%',
            left: `${Math.max(0, dropdownPos.left)}px`,
            marginBottom: '4px',
          }}
        >
          <div className="p-2.5 text-center text-[11px] text-foreground-dim/60">
            No members matching &quot;{mentionQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
