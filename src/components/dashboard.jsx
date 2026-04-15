import React, { useState, useRef } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
);

const PALETTE = [
  "#6c63ff",
  "#10d9a0",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
];
const MAX_PER_CONTAINER = 5;
const NUM_CONTAINERS = 2;

function isDark() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function makeOpts() {
  const dark = isDark();
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: "easeInOutQuart" },
    plugins: {
      legend: {
        labels: {
          color: dark ? "#94a3b8" : "#4a5080",
          font: { size: 11, family: "Outfit, sans-serif" },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: dark ? "rgba(8,12,30,0.96)" : "rgba(255,255,255,0.98)",
        titleColor: dark ? "#f1f5f9" : "#0f1130",
        bodyColor: dark ? "#94a3b8" : "#4a5080",
        borderColor: "rgba(108,99,255,0.3)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        ticks: {
          color: dark ? "#64748b" : "#94a3b8",
          font: { size: 10 },
          maxRotation: 35,
        },
        grid: {
          color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
          drawBorder: false,
        },
        border: { color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" },
      },
      y: {
        ticks: { color: dark ? "#64748b" : "#94a3b8", font: { size: 10 } },
        grid: {
          color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
          drawBorder: false,
        },
        border: { color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" },
      },
    },
  };
}

function makePieOpts() {
  const dark = isDark();
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: dark ? "#94a3b8" : "#4a5080",
          font: { size: 11 },
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: dark ? "rgba(8,12,30,0.96)" : "rgba(255,255,255,0.98)",
        titleColor: dark ? "#f1f5f9" : "#0f1130",
        bodyColor: dark ? "#94a3b8" : "#4a5080",
        borderColor: "rgba(108,99,255,0.3)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
  };
}

function fmt(val) {
  if (typeof val !== "number") return val ?? "—";
  if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + "K";
  return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
}

// ── KPI Card ──
function KpiCard({ label, value, pinned, onPin }) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  return (
    <div className={`kpi-card ${pinned ? "kpi-card-pinned" : ""}`}>
      <button
        className={`kpi-pin-btn ${pinned ? "pinned" : ""}`}
        onClick={onPin}
        title={pinned ? "Unpin" : "Pin"}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={pinned ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l2.4 6.4L21 10l-4.8 4.4 1.4 6.6L12 18l-5.6 3 1.4-6.6L3 10l6.6-1.6z" />
        </svg>
      </button>
      <div className="kpi-card-icon">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <div className="kpi-card-value">{fmt(num)}</div>
      <div className="kpi-card-label">{label}</div>
      <div className="kpi-card-bar">
        <div className="kpi-card-bar-fill" />
      </div>
    </div>
  );
}

// ── Chart Renderer ──
function ChartRenderer({ d }) {
  const chartType = d.chart_type || "bar";
  const isPie = ["pie", "doughnut"].includes(chartType);
  const isLine = chartType === "line";
  const isBar = !isLine && !isPie;

  const chartData = {
    labels: d.labels || [],
    datasets: (d.datasets || []).map((ds, i) => {
      const base = PALETTE[i % PALETTE.length];
      const data = (ds.data || []).map((v) =>
        typeof v === "number" ? v : parseFloat(v) || 0,
      );
      return {
        ...ds,
        data,
        backgroundColor: isPie
          ? PALETTE.slice(0, data.length)
          : isBar
            ? (d.labels || []).map((_, li) => PALETTE[li % PALETTE.length])
            : base + "28",
        borderColor: isPie ? PALETTE.slice(0, data.length) : base,
        borderWidth: isPie ? 2 : isLine ? 2.5 : 0,
        borderRadius: isBar ? 6 : 0,
        tension: 0.4,
        pointRadius: isLine ? 4 : 0,
        pointHoverRadius: 6,
        pointBackgroundColor: base,
        pointBorderColor: "transparent",
        fill: isLine,
      };
    }),
  };

  const opts = isPie ? makePieOpts() : makeOpts();
  switch (chartType) {
    case "line":
      return <Line data={chartData} options={opts} />;
    case "pie":
      return <Pie data={chartData} options={opts} />;
    case "doughnut":
      return <Doughnut data={chartData} options={opts} />;
    default:
      return <Bar data={chartData} options={opts} />;
  }
}

// ── Card Menu ──
function CardMenu({ pinned, onPin, sqlQuery, userQuery, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [popup, setPopup] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  React.useEffect(() => {
    function close(e) {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen((p) => !p);
  }

  return (
    <>
      <div className="db-menu-wrap">
        <button className="db-dots-btn" ref={btnRef} onClick={handleOpen}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {open && (
          <div
            className="db-dropdown"
            ref={ref}
            style={{ top: pos.top, right: pos.right }}
          >
            <button
              className="db-dd-item"
              onClick={() => {
                setPopup("query");
                setOpen(false);
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              View Query
            </button>
            <button
              className="db-dd-item"
              onClick={() => {
                setPopup("sql");
                setOpen(false);
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              View SQL
            </button>
            <div className="db-dd-divider" />
            {!confirmDelete ? (
              <button
                className="db-dd-item db-dd-delete"
                onClick={() => setConfirmDelete(true)}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                Remove chart
              </button>
            ) : (
              <div className="db-dd-confirm">
                <span>Remove this chart?</span>
                <div className="db-dd-confirm-btns">
                  <button
                    className="db-dd-confirm-yes"
                    onClick={() => {
                      onDelete?.();
                      setOpen(false);
                      setConfirmDelete(false);
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="db-dd-confirm-no"
                    onClick={() => setConfirmDelete(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {popup && (
        <div className="info-popup-overlay" onClick={() => setPopup(null)}>
          <div className="info-popup" onClick={(e) => e.stopPropagation()}>
            <div className="info-popup-head">
              <div className="info-popup-head-left">
                {popup === "sql" ? (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                )}
                <span>{popup === "sql" ? "SQL Query" : "Your Query"}</span>
              </div>
              <button
                className="info-popup-close"
                onClick={() => setPopup(null)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {popup === "sql" ? (
              <pre className="info-popup-sql">{sqlQuery || "—"}</pre>
            ) : (
              <p className="info-popup-text">{userQuery || "—"}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Chart Slide ──
function ChartSlide({ item, pinned, onPin, onDelete }) {
  const d = item?.data;
  if (!d) return null;
  const isKpi = d.chart_type === "kpi";
  const values = (d.datasets?.[0]?.data || []).map((v) =>
    typeof v === "number" ? v : parseFloat(v) || 0,
  );

  return (
    <div className="chart-slide">
      {/* Header */}
      <div className="chart-slide-head">
        <div className="chart-slide-head-left">
          <span className="db-type-chip">
            {d.chart_type?.toUpperCase() || "CHART"}
          </span>
          <span
            className="chart-slide-title"
            title={d.datasets?.[0]?.label || item.query}
          >
            {d.datasets?.[0]?.label || item.query || "Chart"}
          </span>
        </div>
        <div className="chart-slide-head-right">
          {/* Pin button — star icon */}
          <button
            className={`chart-pin-btn ${pinned ? "pinned" : ""}`}
            onClick={onPin}
            title={pinned ? "Unpin" : "Pin to Compare"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={pinned ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
            </svg>
          </button>
          <CardMenu
            pinned={pinned}
            onPin={onPin}
            sqlQuery={item.sql_query || d.sql_query}
            userQuery={item.query}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* KPI */}
      {isKpi && (
        <KpiCard
          label={d.datasets?.[0]?.label}
          value={values[0]}
          pinned={false}
          onPin={() => {}}
        />
      )}

      {/* Chart */}
      {!isKpi && (
        <>
          <div className="db-chart-area">
            <ChartRenderer d={d} />
          </div>
          {d.reason && (
            <div className="db-reason">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {d.reason}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Chart Container ──
function ChartContainer({
  charts,
  containerIndex,
  pinnedIds,
  onTogglePin,
  onDeleteChart,
}) {
  const [slideIndex, setSlideIndex] = useState(0);

  // Pinned charts pehle
  const sorted = [
    ...charts.filter(c => pinnedIds.has(c.id)),
    ...charts.filter(c => !pinnedIds.has(c.id)),
  ];
  // Pin change hone pe slide 0 pe reset karo
  const pinnedCount = charts.filter(c => pinnedIds.has(c.id)).length;
  React.useEffect(() => {
    setSlideIndex(0); // pinned chart sabse upar, index 0 pe
  }, [pinnedCount]);

    const total = sorted.length;
  const safeIdx = Math.min(slideIndex, total - 1);
  const current = sorted[safeIdx];
  const isPinned = pinnedIds.has(current?.id);

  return (
    <div
      className={`chart-container ${isPinned ? "chart-container-pinned" : ""}`}
    >
      {/* Pinned glow accent */}
      {isPinned && <div className="chart-container-pin-accent" />}

      {/* Nav bar */}
      <div className="chart-container-nav">
        <div className="chart-container-nav-left">
          <span className="chart-container-label">
            <span className="chart-container-num">{containerIndex + 1}</span>
            Chart
          </span>
          {charts.some((c) => pinnedIds.has(c.id)) && (
            <span className="chart-container-pinned-badge">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 6.4L21 10l-4.8 4.4 1.4 6.6L12 18l-5.6 3 1.4-6.6L3 10l6.6-1.6z" />
              </svg>
              Pinned
            </span>
          )}
        </div>
        <div className="chart-container-nav-right">
          <button
            className="chart-nav-arrow"
            onClick={() => setSlideIndex((p) => Math.max(0, p - 1))}
            disabled={safeIdx === 0}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="chart-nav-count">
            {safeIdx + 1} / {total}
          </span>
          <button
            className="chart-nav-arrow"
            onClick={() => setSlideIndex((p) => Math.min(total - 1, p + 1))}
            disabled={safeIdx === total - 1}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="chart-dots">
          {sorted.map((c, i) => (
            <button
              key={c.id}
              className={`chart-dot ${i === safeIdx ? "active" : ""} ${pinnedIds.has(c.id) ? "pinned" : ""}`}
              onClick={() => setSlideIndex(i)}
            />
          ))}
        </div>
      )}

      {/* Slide */}
      <ChartSlide
        item={current}
        pinned={isPinned}
        onPin={() => onTogglePin(current?.id)}
        onDelete={() => {
          onDeleteChart(current?.id);
          setSlideIndex((p) => Math.max(0, p - 1));
        }}
      />
    </div>
  );
}

// ── Compare Screen ──
function CompareScreen({ pinnedIds, allCharts, onClose }) {
  const pinned = allCharts.filter((c) => pinnedIds.has(c.id));
  const [selected, setSelected] = useState(() =>
    pinned.slice(0, 2).map((c) => c.id),
  );

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev,
    );
  }

  const compareCharts = selected
    .map((id) => allCharts.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="compare-screen">
      <div className="compare-header">
        <div className="compare-header-left">
          <div className="compare-header-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="18" rx="1" />
            </svg>
          </div>
          <div>
            <h2 className="compare-title">Compare Charts</h2>
            <p className="compare-sub">
              Select up to 2 pinned charts to compare
            </p>
          </div>
        </div>
        <button className="compare-close-btn" onClick={onClose}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Pinned cards */}
      <div>
        <div className="compare-section-label">
          Pinned Charts{" "}
          <span className="compare-section-count">{pinned.length}</span>
        </div>
        {pinned.length === 0 ? (
          <div className="compare-empty">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.3"
            >
              <path d="M12 2l2.4 6.4L21 10l-4.8 4.4 1.4 6.6L12 18l-5.6 3 1.4-6.6L3 10l6.6-1.6z" />
            </svg>
            <p>No pinned charts yet. Pin charts from the dashboard.</p>
          </div>
        ) : (
          <div className="compare-pinned-grid">
            {pinned.map((chart) => {
              const isSelected = selected.includes(chart.id);
              const isDisabled = !isSelected && selected.length >= 2;
              return (
                <button
                  key={chart.id}
                  className={`compare-chart-card ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                  onClick={() => !isDisabled && toggleSelect(chart.id)}
                >
                  {isSelected && (
                    <div className="compare-selected-badge">
                      {selected.indexOf(chart.id) + 1}
                    </div>
                  )}
                  <div className="compare-card-type">
                    {chart.data?.chart_type?.toUpperCase()}
                  </div>
                  <div className="compare-card-title">
                    {chart.data?.datasets?.[0]?.label || chart.query || "Chart"}
                  </div>
                  <div className="compare-mini-bars">
                    {(chart.data?.datasets?.[0]?.data || [])
                      .slice(0, 6)
                      .map((v, i) => {
                        const max = Math.max(
                          ...(chart.data?.datasets?.[0]?.data || [1]),
                        );
                        return (
                          <div
                            key={i}
                            className="compare-mini-bar"
                            style={{
                              height: `${Math.max(6, (v / max) * 36)}px`,
                              background: PALETTE[i % PALETTE.length],
                            }}
                          />
                        );
                      })}
                  </div>
                  <div className="compare-card-query">{chart.query}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare view */}
      {compareCharts.length === 2 && (
        <div className="compare-view">
          <div className="compare-view-label">Side by side comparison</div>
          <div className="compare-charts-row">
            {compareCharts.map((chart, i) => {
              const d = chart.data;
              const values = (d?.datasets?.[0]?.data || []).map((v) =>
                typeof v === "number" ? v : parseFloat(v) || 0,
              );
              return (
                <div key={chart.id} className="compare-chart-panel">
                  <div className="compare-panel-head">
                    <span className="compare-panel-num">{i + 1}</span>
                    <span className="compare-panel-title">
                      {d?.datasets?.[0]?.label || chart.query}
                    </span>
                    <span className="db-type-chip">
                      {d?.chart_type?.toUpperCase()}
                    </span>
                  </div>
                  <div className="compare-chart-area">
                    <ChartRenderer d={d} />
                  </div>
                  {values.length > 0 && (
                    <div className="compare-panel-stats">
                      <div className="compare-stat">
                        <span>Total</span>
                        <strong>
                          {fmt(values.reduce((a, b) => a + b, 0))}
                        </strong>
                      </div>
                      <div className="compare-stat">
                        <span>Max</span>
                        <strong>{fmt(Math.max(...values))}</strong>
                      </div>
                      <div className="compare-stat">
                        <span>Avg</span>
                        <strong>
                          {fmt(
                            values.reduce((a, b) => a + b, 0) / values.length,
                          )}
                        </strong>
                      </div>
                    </div>
                  )}
                  {chart.query && (
                    <div className="compare-panel-query">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      {chart.query}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected.length < 2 && pinned.length > 0 && (
        <div className="compare-hint">
          {selected.length === 0
            ? "Select 2 charts to compare"
            : "Select one more chart"}
        </div>
      )}
    </div>
  );
}

// ── Main DashboardBlock ──
export default function DashboardBlock({
  messages,
  compareOpen,
  onOpenCompare,
  onCloseCompare,
}) {
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("db_pinned") || "[]"));
    } catch {
      return new Set();
    }
  });
  const [deletedIds, setDeletedIds] = useState(new Set());

  const allChartMsgs = (messages || []).filter(
    (m) => m.type === "dashboard" && m.data?.chart_type,
  );
  const chartMsgs = allChartMsgs.filter((m) => !deletedIds.has(m.id));

  const kpiCharts = chartMsgs.filter((m) => m.data?.chart_type === "kpi");
  const regularCharts = chartMsgs.filter((m) => m.data?.chart_type !== "kpi");

  // ── Alternating container logic ──
  // Query 1 → Container 0
  // Query 2 → Container 1
  // Query 3 → Container 0
  // Query 4 → Container 1
  // Jab ek container 5 se bhare → next available slot
  const containers = [[], []];
  regularCharts.forEach((chart, idx) => {
    // Find which container has space, starting from alternating
    const preferred = idx % NUM_CONTAINERS;
    if (containers[preferred].length < MAX_PER_CONTAINER) {
      containers[preferred].push(chart);
    } else {
      const other = (preferred + 1) % NUM_CONTAINERS;
      if (containers[other].length < MAX_PER_CONTAINER) {
        containers[other].push(chart);
      } else {
        // Dono bhare — naya container
        containers.push([chart]);
      }
    }
  });

  function togglePin(id) {
    if (!id) return;
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Pin hone pe compare window kholo
        setTimeout(() => onOpenCompare(), 100);
      }
      localStorage.setItem("db_pinned", JSON.stringify([...next]));
      return next;
    });
  }

  function handleDelete(id) {
    if (!id) return;
    setDeletedIds((prev) => new Set([...prev, id]));
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem("db_pinned", JSON.stringify([...next]));
      return next;
    });
  }

  if (chartMsgs.length === 0) return null;

  if (compareOpen) {
    return (
      <CompareScreen
        pinnedIds={pinnedIds}
        allCharts={chartMsgs}
        onClose={onCloseCompare}
      />
    );
  }

  return (
    <div className="db-root">
      {/* KPI Row */}
      {kpiCharts.length > 0 && (
        <div className="kpi-row">
          {kpiCharts.map((m) => (
            <KpiCard
              key={m.id}
              label={m.data?.datasets?.[0]?.label}
              value={m.data?.datasets?.[0]?.data?.[0]}
              pinned={pinnedIds.has(m.id)}
              onPin={() => togglePin(m.id)}
            />
          ))}
        </div>
      )}

      {/* Chart Containers — 2 col grid */}
      <div className="db-containers">
        {containers
          .filter((c) => c.length > 0)
          .map((charts, ci) => (
            <ChartContainer
              key={ci}
              charts={charts}
              containerIndex={ci}
              pinnedIds={pinnedIds}
              onTogglePin={togglePin}
              onDeleteChart={handleDelete}
            />
          ))}
      </div>
    </div>
  );
}
