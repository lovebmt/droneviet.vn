import type { DroneState, StepEvents, Vec3 } from "./physics";

export type MissionId = "cat-canh" | "ha-canh" | "vong" | "so-8";

export interface Mission {
  id: MissionId;
  title: string;
  summary: string;
  /** Seconds; finishing within par with no crash earns three stars. */
  par: number;
  limit: number;
  gates?: Array<Vec3 & { radius: number }>;
  pad?: Vec3 & { radius: number };
  posts?: Vec3[];
}

const ring = (x: number, y: number, z: number) => ({ x, y, z, radius: 1.5 });
const gate = (x: number, z: number) => ({ x, y: 2, z, radius: 2 });

export const MISSIONS: Mission[] = [
  { id: "cat-canh", title: "Cất cánh và giữ độ cao", summary: "Bay lên khoảng 2 m và giữ ổn định đủ 10 giây.", par: 18, limit: 90 },
  { id: "ha-canh", title: "Hạ cánh vào ô", summary: "Bay tới ô hạ cánh màu vàng và đáp nhẹ vào giữa ô.", par: 25, limit: 120, pad: { x: 6, y: 0, z: -6, radius: 1 } },
  { id: "vong", title: "Bay qua chuỗi vòng", summary: "Bay lần lượt qua 5 vòng theo đúng thứ tự.", par: 45, limit: 180, gates: [ring(0, 2, -6), ring(4, 3, -12), ring(0, 4, -18), ring(-5, 3, -13), ring(-3, 2, -5)] },
  {
    id: "so-8",
    title: "Bay số 8",
    summary: "Bay vòng quanh hai cột theo hình số 8, qua đủ 8 cổng.",
    par: 60,
    limit: 240,
    posts: [{ x: -5, y: 0, z: -12 }, { x: 5, y: 0, z: -12 }],
    gates: [gate(0, -12), gate(5, -7), gate(10, -12), gate(5, -17), gate(0, -12), gate(-5, -7), gate(-10, -12), gate(-5, -17)],
  },
];

export interface Run {
  mission: Mission;
  status: "flying" | "completed" | "failed";
  elapsed: number;
  crashes: number;
  hold: number;
  nextGate: number;
  wasAirborne: boolean;
  landingError: number | null;
  message: string | null;
}

export function findMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function createRun(id: MissionId): Run {
  const mission = findMission(id);
  if (!mission) throw new Error(`Unknown mission ${id}`);
  return { mission, status: "flying", elapsed: 0, crashes: 0, hold: 0, nextGate: 0, wasAirborne: false, landingError: null, message: null };
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Short instruction for the HUD. */
export function objective(run: Run): string {
  const m = run.mission;
  if (m.id === "cat-canh") return `Giữ độ cao 1,5–2,5 m: ${Math.min(10, run.hold).toFixed(1)}/10 giây`;
  if (m.id === "ha-canh") return "Hạ cánh nhẹ vào giữa ô vàng";
  return `Cổng ${Math.min(run.nextGate + 1, m.gates!.length)}/${m.gates!.length}`;
}

export function updateRun(run: Run, s: DroneState, events: StepEvents, dt: number): void {
  if (run.status !== "flying") return;
  run.elapsed += dt;
  if (events.crashed) {
    run.crashes += 1;
    run.message = "Va chạm mạnh. Cất cánh lại và tiếp tục.";
  }
  if (s.position.y > 1) run.wasAirborne = true;
  const m = run.mission;

  if (m.id === "cat-canh") {
    if (s.position.y >= 1.5 && s.position.y <= 2.5) run.hold += dt;
    if (run.hold >= 10) run.status = "completed";
  } else if (m.id === "ha-canh" && m.pad) {
    if (events.landed && run.wasAirborne) {
      const error = Math.hypot(s.position.x - m.pad.x, s.position.z - m.pad.z);
      if (error <= m.pad.radius) {
        run.landingError = error;
        run.status = "completed";
      } else {
        run.message = "Hạ cánh ngoài ô. Cất cánh lại và thử lần nữa.";
        run.wasAirborne = false;
      }
    }
  } else if (m.gates) {
    const target = m.gates[run.nextGate];
    if (target && dist(s.position, target) <= target.radius) {
      run.nextGate += 1;
      run.message = null;
      if (run.nextGate >= m.gates.length) run.status = "completed";
    }
  }

  if (run.status === "flying" && run.elapsed >= m.limit) {
    run.status = "failed";
    run.message = "Hết giờ.";
  }
}

export interface RunScore {
  score: number;
  stars: number;
  timeMs: number;
  crashes: number;
}

export function scoreRun(run: Run): RunScore {
  const timeMs = Math.round(run.elapsed * 1000);
  if (run.status !== "completed") return { score: 0, stars: 0, timeMs, crashes: run.crashes };
  const par = run.mission.par;
  const accuracy = run.landingError === null ? 0 : Math.round(200 * (1 - run.landingError / (run.mission.pad?.radius ?? 1)));
  const score = Math.max(0, Math.round(1000 - 8 * Math.max(0, run.elapsed - par) - 150 * run.crashes + accuracy));
  const stars = run.elapsed <= par && run.crashes === 0 ? 3 : run.elapsed <= par * 1.6 && run.crashes <= 1 ? 2 : 1;
  return { score, stars, timeMs, crashes: run.crashes };
}
