"use client";
import { useEffect, useRef, useState } from "react";

interface LastCall {
  ticketId: string;
  code: string;
  sectorId: string;
  sectorName: string;
  calledAt: string;
}

export function PanelClient({ initialLastCalls }: { initialLastCalls: LastCall[] }) {
  const [lastCalls, setLastCalls] = useState<LastCall[]>(initialLastCalls);
  const [now, setNow] = useState(new Date());
  const [pulsing, setPulsing] = useState(false);
  const lastIdRef = useRef<string | null>(initialLastCalls[0]?.ticketId ?? null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const clockInterval = setInterval(() => setNow(new Date()), 1000);
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/painel", { cache: "no-store" });
        const data = await res.json();
        const calls: LastCall[] = data.lastCalls ?? [];
        if (calls[0] && calls[0].ticketId !== lastIdRef.current) {
          if (lastIdRef.current !== null) {
            setPulsing(true);
            beep();
            setTimeout(() => setPulsing(false), 650);
          }
          lastIdRef.current = calls[0].ticketId;
        }
        setLastCalls(calls);
      } catch {
        /* silencioso — painel continua com o último estado conhecido */
      }
    }, 2500);
    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
    };
  }, []);

  function beep() {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.5);
    } catch { /* ambiente sem suporte a áudio */ }
  }

  const last = lastCalls[0];
  const rest = lastCalls.slice(1, 6);

  return (
    <div className="min-h-screen bg-primary-dark text-white flex flex-col">
      <div className="flex items-center justify-between px-11 pt-9">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white text-primary-dark flex items-center justify-center font-bold text-base">SJR</div>
          <div>
            <b className="text-base block">SEMED</b>
            <span className="text-xs text-[#9FCBB1]">São José de Ribamar</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[26px] font-bold tabular-nums">
            {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-[12.5px] text-[#9FCBB1] capitalize">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-10">
        {last ? (
          <>
            <div className="text-sm text-[#9FCBB1] mb-2">Chamando</div>
            <div
              className={`font-display font-bold tabular-nums leading-none transition-transform ${pulsing ? "scale-105" : "scale-100"}`}
              style={{ fontSize: "min(20vw, 220px)" }}
            >
              {last.code}
            </div>
            <div className="text-sm text-[#9FCBB1] mt-3">Dirija-se ao setor</div>
            <div className="text-[clamp(20px,3.4vw,40px)] font-bold text-[#EFF7F1]">{last.sectorName}</div>
          </>
        ) : (
          <div className="text-xl text-[#9FCBB1]">Aguardando primeira chamada do dia…</div>
        )}
      </div>

      <div className="bg-white/5 px-11 pt-4.5 pb-6">
        <div className="text-[11.5px] uppercase tracking-wide text-[#9FCBB1] mb-2.5">Últimas chamadas</div>
        <div className="flex gap-7 flex-wrap">
          {rest.length ? (
            rest.map((c) => (
              <div key={c.ticketId} className="flex items-baseline gap-2">
                <span className="font-display font-bold text-xl tabular-nums">{c.code}</span>
                <span className="text-xs text-[#9FCBB1]">{c.sectorName}</span>
              </div>
            ))
          ) : (
            <span className="text-xs text-[#9FCBB1]">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
