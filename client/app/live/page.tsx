'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function LiveResultsPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<any>({ LDF: 0, UDF: 0, NDA: 0, recent: 'Awaiting connection...' });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Determine WS connection point dynamically or fallback to standard local dev port
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    
    const socketInstance = io(backendUrl);

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('live-tick', (payload: any) => {
      setData(payload);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
           <div className="eyebrow">
             <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green animate-pulse' : 'bg-red'} mr-1 block`}></span>
             {connected ? 'WebSocket Connected' : 'Connecting to Node...'}
           </div>
           <h1 className="text-4xl lg:text-5xl font-display font-black text-text-main mb-2 tracking-tight">
             <span className="text-red">Live</span> Election Tracker
           </h1>
           <p className="text-text-muted">Real-time vote counting engine powered by WebSocket broadcasting. Refreshes natively without page loads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* LDF */}
        <div className="bg-surface border-2 border-red/20 shadow-lg rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all transform hover:scale-105">
           <div className="absolute top-0 left-0 w-full h-1 bg-red"></div>
           <h2 className="text-[14px] font-mono tracking-widest font-bold text-text-light mb-2">LDF LEADS</h2>
           <span className="font-display text-[72px] font-black text-red leading-none">{data.LDF}</span>
        </div>
        
        {/* UDF */}
        <div className="bg-surface border-2 border-blue/20 shadow-lg rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all transform hover:scale-105">
           <div className="absolute top-0 left-0 w-full h-1 bg-blue"></div>
           <h2 className="text-[14px] font-mono tracking-widest font-bold text-text-light mb-2">UDF LEADS</h2>
           <span className="font-display text-[72px] font-black text-blue leading-none">{data.UDF}</span>
        </div>
        
        {/* NDA */}
        <div className="bg-surface border-2 border-saffron/20 shadow-lg rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all transform hover:scale-105">
           <div className="absolute top-0 left-0 w-full h-1 bg-saffron"></div>
           <h2 className="text-[14px] font-mono tracking-widest font-bold text-text-light mb-2">NDA LEADS</h2>
           <span className="font-display text-[72px] font-black text-saffron leading-none">{data.NDA}</span>
        </div>
      </div>
      
      <div className="bg-bg2 border border-border-dark p-6 rounded-xl relative">
        <h3 className="font-mono text-[10px] tracking-widest font-bold uppercase text-text-light mb-4">Latest Terminal Activity</h3>
        <div className="font-mono text-[13px] text-text-main p-4 bg-surface rounded-lg font-medium border border-border-light shadow-inner">
           ➜ {data.recent} <br/>
           <span className="text-text-light text-[11px] mt-2 block">Last server packet received at {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}</span>
        </div>
      </div>

    </div>
  );
}
