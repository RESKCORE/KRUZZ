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
    <div className="glass-panel relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 shadow-[0_24px_48px_rgba(0,0,0,0.6)]">
      {/* Ambient lighting inside visual (Acid Lime) */}
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-[#ccff00]/15 blur-3xl pointer-events-none" />

      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full recording-dot" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#ccff00]">
            Live Packet Traversal
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#8a8a8a]">
          <span>RTT: 12ms</span>
          <span>·</span>
          <span className="text-[#ccff00] font-medium">HTTP 200 OK</span>
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
                  ? "bg-gradient-to-b from-[#162208] to-[#0c1204] border border-[#ccff00]/60 shadow-[0_0_20px_rgba(204,255,0,0.25)]"
                  : "bg-white/[0.02] border border-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-8 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#ccff00] text-[#080808] shadow-[0_0_12px_rgba(204,255,0,0.6)]"
                      : "bg-white/[0.04] text-[#8a8a8a]"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <span className="font-mono text-[10px] text-white/30">0{i + 1}</span>
              </div>

              <div className="mt-3">
                <p className="text-xs font-bold text-[#f5f5f5]">{node.title}</p>
                <p className="text-[11px] text-[#8a8a8a]">{node.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/[0.05]">
                <p
                  className={`font-mono text-[9px] transition-colors truncate ${
                    isActive ? "text-[#ccff00] font-semibold" : "text-white/30"
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
      <div className="mt-5 rounded-2xl bg-[#080808] border border-white/[0.06] p-3.5 font-mono text-[11px] text-[#b8b8b8] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-hidden">
          <span className="text-[#ccff00] font-bold">GET</span>
          <span className="text-[#f5f5f5]">/api/v1/investigations/client-server</span>
          <span className="text-[#8a8a8a]">HTTP/1.1</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#8a8a8a]">
          <span>Connection: keep-alive</span>
          <span>·</span>
          <span>1.4 KB</span>
        </div>
      </div>
    </div>
  );
}
