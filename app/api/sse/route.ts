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

  const stream = new ReadableStream({
    start(controller) {
      const clientId = crypto.randomUUID();

      clients.set(clientId, {
        id: clientId,
        controller,
      });

      const encoder = new TextEncoder();
      const data = `data: ${JSON.stringify({ type: 'connected', id: clientId })}\n\n`;
      controller.enqueue(encoder.encode(data));

      request.signal.addEventListener('abort', () => {
        clients.delete(clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export function broadcastEvent(data: string) {
  const encoder = new TextEncoder();
  const message = `data: ${data}\n\n`;

  clients.forEach((client) => {
    try {
      client.controller.enqueue(encoder.encode(message));
    } catch {
      clients.delete(client.id);
    }
  });
}

