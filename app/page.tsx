'use client';

import { useEffect, useState, useRef } from 'react';

type EventData = {
  type: string;
  timestamp?: string;
  id?: string;
};

export default function Home() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: EventData = JSON.parse(event.data);
        setEvents((prev) => [data, ...prev]);
      } catch (error) {
        console.error('Failed to parse event data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handlePublish = async () => {
    try {
      await fetch('/api/publish', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            SSE Server
          </h1>

          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={handlePublish}
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[200px]"
          >
            Send Current Time
          </button>

          <div className="w-full mt-8">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
              Received Events
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  No events received yet
                </p>
              ) : (
                events.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    {event.type === 'time' && event.timestamp && (
                      <div>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          Time:
                        </span>
                        <span className="ml-2 font-mono text-black dark:text-zinc-50">
                          {event.timestamp}
                        </span>
                      </div>
                    )}
                    {event.type === 'connected' && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Connected (ID: {event.id})
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
