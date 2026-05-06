import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Plus, Minus, RotateCcw, X, User, Calendar, Users } from "lucide-react";
import { useFloorPlan } from "../../hooks/useFloorPlan";
import { FloorPlanTooltip } from "./FloorPlanTooltip";
import { assignTable, clearTable, fetchReservations, fetchCustomers } from "../../api/restaurantApi";
import type { FloorPlanTable, Reservation, Customer } from "../../types/models";

/* ── Colour tokens per status ── */
const FILL: Record<string, string> = {
  empty: "#059669",    // emerald-600
  seated: "#dc2626",   // red-600
  reserved: "#d97706", // amber-600
};
const FILL_LIGHT: Record<string, string> = {
  empty: "#10b981",
  seated: "#ef4444",
  reserved: "#f59e0b",
};
const GLOW: Record<string, string> = {
  empty: "rgba(16,185,129,0.35)",
  seated: "rgba(239,68,68,0.35)",
  reserved: "rgba(245,158,11,0.35)",
};

const STATUS_BG: Record<string, string> = {
  empty: "bg-emerald-500/10 border-emerald-500/20",
  seated: "bg-red-500/10 border-red-500/20",
  reserved: "bg-amber-500/10 border-amber-500/20",
};

const STATUS_TEXT: Record<string, string> = {
  empty: "text-emerald-400",
  seated: "text-red-400",
  reserved: "text-amber-400",
};

/* ── Chair positions around a table ── */
function getChairPositions(capacity: number, cx: number, cy: number, radius: number) {
  const chairs: { x: number; y: number }[] = [];
  const chairRadius = radius + 18;
  for (let i = 0; i < capacity; i++) {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2;
    chairs.push({
      x: cx + chairRadius * Math.cos(angle),
      y: cy + chairRadius * Math.sin(angle),
    });
  }
  return chairs;
}

/* ── Single Table SVG ── */
function TableShape({
  table,
  cx,
  cy,
  onHover,
  onLeave,
  onClick,
}: {
  table: FloorPlanTable;
  cx: number;
  cy: number;
  onHover: (t: FloorPlanTable, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (t: FloorPlanTable) => void;
}) {
  const r = table.capacity <= 4 ? 28 : 34;
  const chairs = getChairPositions(table.capacity, cx, cy, r);
  const isRound = table.capacity <= 4;
  const fill = FILL[table.status];
  const fillLight = FILL_LIGHT[table.status];
  const glow = GLOW[table.status];

  return (
    <g
      onMouseEnter={(e) => onHover(table, e)}
      onMouseMove={(e) => onHover(table, e)}
      onMouseLeave={onLeave}
      onClick={() => onClick(table)}
      className="cursor-pointer transition-transform hover:scale-105"
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {/* Glow */}
      <circle cx={cx} cy={cy} r={r + 10} fill={glow} opacity={0.5}>
        {table.status === "seated" && (
          <animate
            attributeName="opacity"
            values="0.3;0.6;0.3"
            dur="2.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Table body */}
      {isRound ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#grad-${table.status})`}
          stroke={fillLight}
          strokeWidth={2}
        />
      ) : (
        <rect
          x={cx - r}
          y={cy - r * 0.7}
          width={r * 2}
          height={r * 1.4}
          rx={10}
          fill={`url(#grad-${table.status})`}
          stroke={fillLight}
          strokeWidth={2}
        />
      )}

      {/* Table number */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={13}
        fontWeight={700}
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
      >
        {String(table.table_number).padStart(2, "0")}
      </text>

      {/* Chairs */}
      {chairs.map((ch, i) => (
        <circle
          key={i}
          cx={ch.x}
          cy={ch.y}
          r={6}
          fill="rgba(255,255,255,0.08)"
          stroke={fill}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}

/* ── Main FloorPlan Component ── */
export function FloorPlan() {
  const { areas, loading, error, refresh } = useFloorPlan();
  const [selectedTable, setSelectedTable] = useState<FloorPlanTable | null>(null);
  const [tooltip, setTooltip] = useState<{
    table: FloorPlanTable;
    x: number;
    y: number;
  } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleHover = useCallback(
    (t: FloorPlanTable, e: React.MouseEvent) => {
      // Don't show tooltip if modal is open
      if (selectedTable) return;
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }
      setTooltip({ table: t, x: e.clientX, y: e.clientY });
    },
    [selectedTable],
  );

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setTooltip(null), 100);
  }, []);

  const handleClick = useCallback((t: FloorPlanTable) => {
    setTooltip(null);
    setSelectedTable(t);
  }, []);

  // Compute totals for the legend
  const allTables = areas.flatMap((a) => a.tables);
  const counts = {
    empty: allTables.filter((t) => t.status === "empty").length,
    seated: allTables.filter((t) => t.status === "seated").length,
    reserved: allTables.filter((t) => t.status === "reserved").length,
  };

  return (
    <section className="space-y-6">
      {/* Header bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Live Floor Plan
            </h2>
            <p className="text-xs text-zinc-500">
              Real-time table status · drag to pan, scroll to zoom
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <LegendDot color="#10b981" label="Empty" count={counts.empty} />
              <LegendDot color="#ef4444" label="Seated" count={counts.seated} />
              <LegendDot color="#f59e0b" label="Reserved" count={counts.reserved} />
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Main Floor Plan Box */}
      {areas.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-lg shadow-black/20 overflow-hidden h-[650px] cursor-grab active:cursor-grabbing"
        >
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={3}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                  <div className="relative min-w-[800px] min-h-[800px] p-12">
                    {/* Global SVG Definitions & Continuous Background Grid */}
                    <div className="pointer-events-none absolute inset-0 z-0 opacity-50">
                      <svg width="100%" height="100%">
                        <defs>
                          <pattern
                            id="global-grid"
                            width="30"
                            height="30"
                            patternUnits="userSpaceOnUse"
                          >
                            <circle cx="0" cy="0" r="0.6" fill="rgba(255,255,255,0.08)" />
                            <circle cx="30" cy="0" r="0.6" fill="rgba(255,255,255,0.08)" />
                            <circle cx="0" cy="30" r="0.6" fill="rgba(255,255,255,0.08)" />
                            <circle cx="30" cy="30" r="0.6" fill="rgba(255,255,255,0.08)" />
                          </pattern>
                          <radialGradient id="grad-empty" cx="50%" cy="30%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                          </radialGradient>
                          <radialGradient id="grad-seated" cx="50%" cy="30%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                          </radialGradient>
                          <radialGradient id="grad-reserved" cx="50%" cy="30%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                          </radialGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#global-grid)" />
                      </svg>
                    </div>

                    <div className="relative z-10 space-y-12">
                      {areas.map((area) => (
                        <div key={area.area_id}>
                          {/* Area header */}
                          <div className="mb-6 flex items-center gap-3 border-b border-zinc-800/60 pb-3">
                            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-200">
                              {area.area_name}
                            </h3>
                            <span className="ml-auto rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-medium text-zinc-400">
                              {area.tables.length} table{area.tables.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* SVG floor for this area */}
                          {area.tables.length > 0 ? (
                            <div className="relative overflow-visible">
                              <svg
                                viewBox={`0 0 ${Math.min(area.tables.length, 4) * 140} ${
                                  Math.ceil(area.tables.length / 4) * 140
                                }`}
                                className="w-full"
                                style={{ minHeight: Math.ceil(area.tables.length / 4) * 140 }}
                              >
                                {/* Tables */}
                                {area.tables.map((t, tIdx) => {
                                  const col = tIdx % 4;
                                  const row = Math.floor(tIdx / 4);
                                  const cx = 70 + col * 140;
                                  const cy = 70 + row * 140;
                                  return (
                                    <TableShape
                                      key={t.table_id}
                                      table={t}
                                      cx={cx}
                                      cy={cy}
                                      onHover={handleHover}
                                      onLeave={handleLeave}
                                      onClick={handleClick}
                                    />
                                  );
                                })}
                              </svg>
                            </div>
                          ) : (
                            <div className="text-sm italic text-zinc-600">
                              No tables assigned to this area.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TransformComponent>

                {/* Floating UI Controls */}
                <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-2 shadow-xl backdrop-blur-md">
                  <button
                    onClick={() => zoomIn(0.2)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    title="Zoom In"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    onClick={() => zoomOut(0.2)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    title="Zoom Out"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="h-px w-full bg-zinc-800" />
                  <button
                    onClick={() => resetTransform()}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    title="Reset View"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </>
            )}
          </TransformWrapper>
        </motion.div>
      ) : (
        !loading && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-10 text-center text-sm text-zinc-500">
            No dining areas found. Check that DiningArea and Table data exist in the database.
          </div>
        )
      )}

      {/* Tooltip portal */}
      <FloorPlanTooltip
        table={tooltip?.table ?? null}
        x={tooltip?.x ?? 0}
        y={tooltip?.y ?? 0}
        visible={!!tooltip}
      />

      <TableActionModal
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
        onRefresh={refresh}
      />
    </section>
  );
}

/* ── Table Action Modal ── */
function TableActionModal({
  table,
  onClose,
  onRefresh,
}: {
  table: FloorPlanTable | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [resData, setResData] = useState<{ res: Reservation; cust: Customer | undefined }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (table?.status === "empty") {
      setLoading(true);
      Promise.all([fetchReservations(50), fetchCustomers(50)])
        .then(([r, c]) => {
          const activeRes = r.items.filter(
            (res) => res.status !== "cancelled" && res.status !== "completed",
          );
          const joined = activeRes.map((res) => ({
            res,
            cust: c.items.find((cust) => cust.customer_id === res.customer_id),
          }));
          setResData(joined);
        })
        .finally(() => setLoading(false));
    }
  }, [table]);

  if (!table) return null;

  async function handleAssign(resId: number) {
    if (!table) return;
    setSubmitting(true);
    try {
      await assignTable(table.table_id, resId);
      onRefresh();
      onClose();
    } catch (e) {
      alert("Failed to assign reservation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClear() {
    if (!table) return;
    setSubmitting(true);
    try {
      await clearTable(table.table_id);
      onRefresh();
      onClose();
    } catch (e) {
      alert("Failed to clear table.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>

          <h3 className="mb-1 text-lg font-bold text-white">
            Table {String(table.table_number).padStart(2, "0")} Action
          </h3>
          <p className="mb-6 text-sm text-zinc-400">
            Current status: <span className="font-semibold uppercase text-zinc-300">{table.status}</span>
          </p>

          {table.status === "empty" ? (
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-300">Assign a Reservation</p>
              {loading ? (
                <div className="py-8 text-center text-sm text-zinc-500">Loading reservations...</div>
              ) : resData.length > 0 ? (
                <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
                  {resData.map(({ res, cust }) => (
                    <div
                      key={res.reservation_id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-medium text-zinc-200">
                          <User size={14} className="text-zinc-500" />
                          {cust ? `${cust.first_name} ${cust.last_name}` : "Unknown"}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {res.reservation_time}
                          </span>
                          <span 
                            className={`flex items-center gap-1 ${res.party_size > table.capacity ? 'text-red-400' : ''}`}
                            title={res.party_size > table.capacity ? `Party of ${res.party_size} exceeds table capacity of ${table.capacity}` : undefined}
                          >
                            <Users size={12} /> {res.party_size}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => res.reservation_id && handleAssign(res.reservation_id)}
                        disabled={submitting || res.party_size > table.capacity}
                        title={res.party_size > table.capacity ? `Table capacity (${table.capacity}) exceeded` : undefined}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 ${
                          res.party_size > table.capacity 
                            ? "bg-zinc-800 cursor-not-allowed" 
                            : "bg-zinc-800 hover:bg-emerald-600"
                        }`}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                  No unassigned upcoming reservations.
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Current Occupant
                </div>
                {table.visit ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-200">{table.visit.customer_name}</p>
                    <p className="text-sm text-zinc-400">Party of {table.visit.party_size}</p>
                    <p className="text-xs text-zinc-500">Arrived at {table.visit.arrival_time}</p>
                  </div>
                ) : table.reservation ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-200">{table.reservation.customer_name}</p>
                    <p className="text-sm text-zinc-400">Party of {table.reservation.party_size}</p>
                    <p className="text-xs text-zinc-500">
                      Reserved for {table.reservation.reservation_time}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">Unknown occupant</p>
                )}
              </div>
              <button
                onClick={handleClear}
                disabled={submitting}
                className="w-full rounded-xl bg-red-500/10 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {submitting ? "Clearing..." : "Clear Table"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ── Legend dot ── */
function LegendDot({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-zinc-400">
        {label}{" "}
        <span className="text-zinc-600">({count})</span>
      </span>
    </div>
  );
}
