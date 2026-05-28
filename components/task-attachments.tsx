'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File } from 'lucide-react';

export default function TaskAttachments({ attachments = [] }: { attachments?: any[] }) {
  const getFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <Card className="rounded-xl overflow-hidden bg-card border border-border-subtle shadow-none p-0">
      <CardHeader className="border-b bg-surface-1 border-border-subtle flex flex-row items-center justify-between gap-4 w-full py-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground-muted">
          <>
            <File className="w-4 h-4 text-foreground-dim" />
            Attachments ({attachments.length})
          </>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 bg-card">
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-md border bg-surface-3 border-border-subtle hover:border-border-default transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center border bg-surface-1 border-border-strong">
                  <span className="text-[10px] font-black text-foreground-dim">
                    {getFileIcon(attachment.filename)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-[10px] text-foreground-dim/70 mt-0.5 font-mono">
                    {getFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-center py-6 text-foreground-dim/60 italic">
            No attachments yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
