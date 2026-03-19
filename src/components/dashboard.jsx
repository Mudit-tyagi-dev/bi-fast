import { useState } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import '../styles/dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Filler, Tooltip, Legend
);

const PALETTE = [
  'rgba(108,99,255,0.85)', 'rgba(16,217,160,0.85)', 'rgba(251,191,36,0.85)',
  'rgba(248,113,113,0.85)', 'rgba(167,139,250,0.85)', 'rgba(96,165,250,0.85)',
  'rgba(251,146,60,0.85)',  'rgba(52,211,153,0.85)',
];
const BORDERS = [
  '#6c63ff','#10d9a0','#fbbf24','#f87171','#a78bfa','#60a5fa','#fb923c','#34d399',
];

const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600, easing: 'easeInOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0e1226',
      borderColor: '#22284a',
      borderWidth: 1,
      titleColor: '#e8eaf8',
      bodyColor: '#9098c8',
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      ticks: { color: '#9098c8', font: { size: 11 } },
      grid: { color: 'rgba(34,40,74,0.5)' },
      border: { color: 'rgba(34,40,74,0.5)' },
    },
    y: {
      ticks: { color: '#9098c8', font: { size: 11 } },
      grid: { color: 'rgba(34,40,74,0.5)' },
      border: { color: 'rgba(34,40,74,0.5)' },
    },
  },
};

const PIE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600 },
  plugins: {
    legend: {
      display: true,
      position: 'right',
      labels: { color: '#9098c8', font: { size: 11 }, padding: 14, boxWidth: 12 },
    },
    tooltip: {
      backgroundColor: '#0e1226',
      borderColor: '#22284a',
      borderWidth: 1,
      titleColor: '#e8eaf8',
      bodyColor: '#9098c8',
      padding: 10,
    },
  },
};

function fmt(n) {
  if (typeof n !== 'number') return n;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function KpiCard({ label, value, rank, color, delay }) {
  return (
    <div className="kpi-card" style={{ animationDelay: `${delay}ms`, '--kc': color }}>
      <div className="kpi-rank">#{rank}</div>
      <div className="kpi-value">{fmt(value)}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-bar">
        <div className="kpi-bar-fill" style={{ width: '100%', background: color }} />
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, delay, fullWidth }) {
  return (
    <div className={`chart-card ${fullWidth ? 'full-width' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="chart-card-head">
        <div>
          <div className="chart-card-title">{title}</div>
          {subtitle && <div className="chart-card-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="chart-card-body">{children}</div>
    </div>
  );
}

function InsightPill({ text, index }) {
  const colors = ['#6c63ff', '#10d9a0', '#fbbf24', '#f87171', '#a78bfa'];
  const c = colors[index % colors.length];
  return (
    <div className="insight-pill" style={{ '--ic': c }}>
      <span className="insight-dot" style={{ background: c }} />
      {text}
    </div>
  );
}

export default function DashboardBlock({ data, query, explanation }) {
  const [activeChart, setActiveChart] = useState('bar');
  if (!data || !data.labels || !data.values) return null;

  const { labels, values, x_axis, y_axis } = data;
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const totalVal = values.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [{
      label: y_axis || 'Value',
      data: values,
      backgroundColor: PALETTE,
      borderColor: BORDERS,
      borderWidth: 1.5,
      borderRadius: activeChart === 'bar' ? 6 : 0,
      tension: 0.4,
      fill: activeChart === 'line',
      pointBackgroundColor: '#6c63ff',
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBorderColor: '#0e1226',
      pointBorderWidth: 2,
    }],
  };

  const lineChartData = {
    labels,
    datasets: [{
      label: y_axis || 'Value',
      data: values,
      backgroundColor: 'rgba(108,99,255,0.15)',
      borderColor: '#6c63ff',
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#6c63ff',
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBorderColor: '#0e1226',
      pointBorderWidth: 2,
    }],
  };

  const topLabel = labels[values.indexOf(maxVal)];
  const bottomLabel = labels[values.indexOf(minVal)];
  const insights = [
    `${topLabel} leads with ${fmt(maxVal)} — highest in the dataset`,
    `Average across all categories: ${fmt(avgVal)}`,
    `${bottomLabel} has the lowest value at ${fmt(minVal)}`,
    `Total combined: ${fmt(totalVal)}`,
  ];

  const chartTypes = [
    { id: 'bar', label: 'Bar' },
    { id: 'line', label: 'Line' },
    { id: 'pie', label: 'Pie' },
    { id: 'doughnut', label: 'Donut' },
  ];

  return (
    <div className="dashboard-block">
      

      <div className="kpi-row">
        {labels.slice(0, 4).map((label, i) => (
          <KpiCard
            key={i}
            label={label}
            value={values[i]}
            rank={i + 1}
            color={BORDERS[i % BORDERS.length]}
            delay={i * 80}
          />
        ))}
      </div>

      <div className="chart-type-switcher">
        {chartTypes.map(ct => (
          <button
            key={ct.id}
            className={`ct-btn ${activeChart === ct.id ? 'active' : ''}`}
            onClick={() => setActiveChart(ct.id)}
          >
            {ct.label}
          </button>
        ))}
      </div>

      <div className="charts-grid">
        <ChartCard
          title={y_axis || 'Value'}
          subtitle={x_axis ? `By ${x_axis}` : 'Distribution'}
          delay={100}
          fullWidth={activeChart === 'line'}
        >
          <div className="chart-canvas-wrap">
            {activeChart === 'bar' && <Bar data={chartData} options={BASE_OPTS} />}
            {activeChart === 'line' && <Line data={lineChartData} options={BASE_OPTS} />}
            {activeChart === 'pie' && <Pie data={chartData} options={PIE_OPTS} />}
            {activeChart === 'doughnut' && <Doughnut data={chartData} options={PIE_OPTS} />}
          </div>
        </ChartCard>

        {/* {activeChart === 'bar' && (
          <ChartCard title="Share Distribution" subtitle="Proportional view" delay={200}>
            <div className="chart-canvas-wrap">
              <Doughnut data={chartData} options={PIE_OPTS} />
            </div>
          </ChartCard>
        )} */}

        {(activeChart === 'pie' || activeChart === 'doughnut') && (
          <ChartCard title="Comparison View" subtitle="Absolute values" delay={200}>
            <div className="chart-canvas-wrap">
              <Bar data={chartData} options={BASE_OPTS} />
            </div>
          </ChartCard>
        )}
      </div>

      <div className="dash-bottom-row">
        <div className="insights-panel">
          <div className="insights-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Key Insights
          </div>
          {insights.map((ins, i) => (
            <InsightPill key={i} text={ins} index={i} />
          ))}
        </div>

        {explanation && (
          <div className="explanation-panel">
            <div className="insights-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              AI Analysis
            </div>
            <p className="explanation-text">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}