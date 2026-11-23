"use client";

import { Gauge, Play, Star } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MISSIONS, type MissionId } from "@/sim/missions";
import { loadSimulator } from "./load-simulator";
import { loadBest, type SimResult } from "./results";

type AppProps = { missionId: MissionId; onExit(): void; onResult(result: SimResult): void };

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex" aria-label={`${count} trên 3 sao`}>
      {[0, 1, 2].map((i) => <Star key={i} size={16} strokeWidth={1.75} aria-hidden="true" className={i < count ? "fill-sun text-sun" : "text-line"} />)}
    </span>
  );
}

/** Mission picker; the engine is fetched only when the visitor presses "Bắt đầu". */
export function SimLauncher() {
  const [best, setBest] = useState<Record<string, SimResult>>({});
  const [running, setRunning] = useState<MissionId | null>(null);
  const [App, setApp] = useState<ComponentType<AppProps> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read after mount so server and client markup match
    setBest(loadBest());
  }, []);

  async function start(id: MissionId) {
    setError(null);
    setLoading(true);
    try {
      const mod = await loadSimulator();
      setApp(() => mod.SimulatorApp as ComponentType<AppProps>);
      setRunning(id);
    } catch {
      setError("Không tải được trình mô phỏng. Kiểm tra kết nối mạng rồi thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2">
        {MISSIONS.map((m, i) => (
          <li key={m.id} className="flex flex-col rounded-2xl border border-line p-6">
            <p className="text-sm font-semibold text-muted">Bài {i + 1}</p>
            <h3 className="mt-1 text-xl font-semibold">{m.title}</h3>
            <p className="mt-2 text-muted">{m.summary}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
              {best[m.id] ? (
                <span className="flex items-center gap-2 text-sm"><Stars count={best[m.id].stars} /> {best[m.id].score} điểm</span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-muted"><Gauge size={16} strokeWidth={1.75} aria-hidden="true" /> Chưa bay</span>
              )}
              <Button variant="sun" disabled={loading} onClick={() => void start(m.id)} aria-label={`Bắt đầu ${m.title}`}>
                <Play size={16} strokeWidth={2} aria-hidden="true" /> {loading ? "Đang tải…" : "Bắt đầu"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p role="alert" className="mt-4 text-red-800">{error}</p> : null}
      {running && App ? (
        <App
          missionId={running}
          onExit={() => setRunning(null)}
          onResult={() => setBest(loadBest())}
        />
      ) : null}
    </>
  );
}
