'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File } from 'lucide-react';

export default function TaskAttachments({
  attachments = [],
}: {
  attachments?: any[];
}) {
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
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <File className='w-5 h-5' />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {attachments.length > 0 ? (
          <div className='space-y-2'>
            {attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className='flex items-center gap-3 p-3 rounded-lg bg-gray-50'
              >
                <div className='flex-shrink-0 w-10 h-10 bg-blue-50 rounded flex items-center justify-center'>
                  <span className='text-xs font-bold text-blue-600'>
                    {getFileIcon(attachment.filename)}
                  </span>
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {attachment.filename}
                  </p>
                  <p className='text-xs text-gray-600'>
                    {getFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-gray-500 text-center py-4'>
            No attachments yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
