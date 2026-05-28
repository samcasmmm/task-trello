'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File } from 'lucide-react';

export default function TaskAttachments({ attachments = [] }: { attachments?: any[] }) {
  const getFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <Card className="rounded-lg overflow-hidden bg-surface-2 border border-border-subtle">
      <CardHeader className="pb-3 border-b bg-surface-1 border-border-subtle">
        <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <File className="w-4 h-4 text-slate-500" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-surface-3 border-border-subtle"
              >
                <div className="shrink-0 w-10 h-10 rounded flex items-center justify-center border bg-surface-1 border-border-strong">
                  <span className="text-[10px] font-black text-slate-400">
                    {getFileIcon(attachment.filename)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {getFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">No attachments yet</p>
        )}
      </CardContent>
    </Card>
  );
}
