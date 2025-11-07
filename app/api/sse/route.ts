import { NextRequest } from 'next/server';

type Client = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Map<string, Client>();

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://sse-server-proto.vercel.app',
  ];

  const isAllowed = origin && allowedOrigins.includes(origin);
  const allowOrigin = isAllowed ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  const encoder = new TextEncoder();
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, {
        id: clientId,
        controller,
      });

      const connectedData = `data: ${JSON.stringify({ type: 'connected', id: clientId })}\n\n`;
      controller.enqueue(encoder.encode(connectedData));

      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `: heartbeat\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch {
          clearInterval(heartbeatInterval);
          clients.delete(clientId);
        }
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        clients.delete(clientId);
        try {
          controller.close();
        } catch {
          // 이미 닫혔을 수 있음
        }
      });
    },
    cancel() {
      clients.delete(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export function broadcastEvent(data: string) {
  const encoder = new TextEncoder();
  const message = `data: ${data}\n\n`;

  const deadClients: string[] = [];

  clients.forEach((client, clientId) => {
    try {
      client.controller.enqueue(encoder.encode(message));
    } catch {
      deadClients.push(clientId);
    }
  });

  deadClients.forEach((clientId) => {
    clients.delete(clientId);
  });
}

