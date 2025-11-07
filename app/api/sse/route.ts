import { NextRequest } from 'next/server';

type Client = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Map<string, Client>();

export async function GET(request: NextRequest) {
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
    } catch (error) {
      clients.delete(client.id);
    }
  });
}

