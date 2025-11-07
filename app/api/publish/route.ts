import { NextResponse } from 'next/server';
import { broadcastEvent } from '../sse/route';

function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function POST() {
  const now = new Date();
  const formattedTime = formatDateTime(now);
  
  broadcastEvent(JSON.stringify({ 
    type: 'time',
    timestamp: formattedTime,
  }));
  
  return NextResponse.json({ 
    success: true, 
    timestamp: formattedTime 
  });
}

