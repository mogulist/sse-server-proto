'use client';

import { useState } from 'react';

type PublishResponse = {
  success: boolean;
  timestamp: string;
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send event');
      }

      const data: PublishResponse = await response.json();
      setLastSentTime(data.timestamp);
    } catch (error) {
      setError('이벤트 전송에 실패했습니다.');
      console.error('Failed to publish event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center w-full">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            SSE Server
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
            버튼을 클릭하면 현재 시간을 SSE로 구독 중인 클라이언트들에게 전송합니다.
          </p>

          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed md:w-[200px]"
          >
            {isLoading ? '전송 중...' : 'Send Current Time'}
          </button>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 w-full max-w-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {lastSentTime && !error && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 w-full max-w-md">
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                이벤트가 성공적으로 전송되었습니다!
              </p>
              <p className="text-base font-mono text-green-700 dark:text-green-300">
                {lastSentTime}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
