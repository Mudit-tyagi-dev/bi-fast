import React from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";

const COLORS = [
  "rgba(99,102,241,0.9)", // indigo
  "rgba(16,185,129,0.9)", // green
  "rgba(251,191,36,0.9)", // yellow
  "rgba(239,68,68,0.9)", // red
  "rgba(59,130,246,0.9)", // blue
  "rgba(168,85,247,0.9)", // purple
  "rgba(236,72,153,0.9)", // pink
];

export default function DashboardBlock({
  data,
  query,
  explanation,
  onPin,
  onSelect,
}) {
  if (!data || !data.labels || !data.datasets) return null;

  const values = data.datasets[0]?.data || [];

  const total = values.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / values.length);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: COLORS[i % COLORS.length],
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 2,
      tension: 0.4,
    })),
  };

  const renderChart = () => {
    switch (data.chart_type) {
      case "line":
        return <Line data={chartData} />;
      case "pie":
        return <Pie data={chartData} />;
      case "doughnut":
        return <Doughnut data={chartData} />;
      default:
        return <Bar data={chartData} />;
    }
  };

  return (
    <div className="dashboard-block">
      {/* Header */}
      <div className="dash-header">
        <h2>{query}</h2>

        <div className="dash-actions">
          <button onClick={() => onPin({ data, query, explanation })}>
            📌
          </button>

          <input
            type="checkbox"
            onChange={(e) => onSelect(data, e.target.checked)}
          />
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-row">
        <div className="kpi-card">
          <span>Total</span>
          <h3>{total}</h3>
        </div>
        <div className="kpi-card">
          <span>Avg</span>
          <h3>{avg}</h3>
        </div>
        <div className="kpi-card">
          <span>Max</span>
          <h3>{max}</h3>
        </div>
        <div className="kpi-card">
          <span>Min</span>
          <h3>{min}</h3>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-card">{renderChart()}</div>

      {/* Reason */}
      {data.reason && (
        <div className="reason-card">
          <h4>Why this chart?</h4>
          <p>{data.reason}</p>
        </div>
      )}

      {/* Insight */}
      {explanation && (
        <div className="insights">
          <h4>AI Insight</h4>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}
