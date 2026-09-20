import { useEffect, useState } from "react";
import { Server, Globe, Shield, Database } from "lucide-react";

export function HeroArchitectureVisual() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const NODES = [
    {
      id: "client",
      title: "Client",
      subtitle: "Browser Engine",
      icon: Globe,
      status: "TCP Handshake",
    },
    {
      id: "proxy",
      title: "Edge Proxy",
      subtitle: "TLS Termination",
      icon: Shield,
      status: "HTTP/1.1 Keep-Alive",
    },
    {
      id: "server",
      title: "App Service",
      subtitle: "Go Runtime",
      icon: Server,
      status: "Route Dispatch",
    },
    {
      id: "db",
      title: "KV Store",
      subtitle: "Redis In-Memory",
      icon: Database,
      status: "O(1) Hash Lookup",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-black bg-white p-6 shadow-xs text-black">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-black" />
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black">
            Live Packet Traversal
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-600">
          <span>RTT: 12ms</span>
          <span>·</span>
          <span className="text-black font-black">HTTP 200 OK</span>
        </div>
      </div>

      {/* Architecture Node Pipeline */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {NODES.map((node, i) => {
          const Icon = node.icon;
          const isActive = activeStep === i;
          return (
            <div
              key={node.id}
              className={`relative rounded-2xl p-3.5 transition-all duration-300 ${
                isActive
                  ? "bg-neutral-100 border-2 border-black shadow-xs"
                  : "bg-white border-2 border-black/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-8 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-black text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 border border-neutral-300"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <span className="font-mono text-[10px] text-neutral-400 font-bold">0{i + 1}</span>
              </div>

              <div className="mt-3">
                <p className="text-xs font-black text-black">{node.title}</p>
                <p className="text-[11px] text-neutral-600">{node.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-black/10">
                <p
                  className={`font-mono text-[9px] transition-colors truncate ${
                    isActive ? "text-black font-black" : "text-neutral-500 font-medium"
                  }`}
                >
                  {isActive ? `▶ ${node.status}` : node.status}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code Request Stream Line */}
      <div className="mt-5 rounded-2xl bg-neutral-50 border-2 border-black p-3.5 font-mono text-[11px] text-black flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-hidden">
          <span className="text-black font-black">GET</span>
          <span className="text-neutral-800 font-medium">/api/v1/investigations/client-server</span>
          <span className="text-neutral-500 font-bold">HTTP/1.1</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neutral-600">
          <span>Connection: keep-alive</span>
          <span>·</span>
          <span>1.4 KB</span>
        </div>
      </div>
    </div>
  );
}
