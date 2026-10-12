import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { EVENT_CATEGORIES, getEventCategory } from "../event-categories";

const EventGenresChart = ({ events }) => {
  const categories = events.map(getEventCategory);
  const data = EVENT_CATEGORIES.map(({ name, color }) => ({
    name, color, value: categories.filter((category) => category === name).length,
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <>
      <div className="donut-chart" role="img" aria-label={`Category distribution of ${total} categorized events`}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={96} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
              {data.map(({ name, color }) => <Cell key={name} fill={color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} itemStyle={{ color: "var(--text)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className={`donut-center ${total ? "" : "donut-empty"}`}><strong>{events.length}</strong><span>Total events</span></div>
      </div>
      <div className="category-legend" aria-label="Category counts">
        {data.filter(({ value }) => value > 0).map(({ name, color, value }) => (
          <div className="legend-row" key={name} style={{ "--category-accent": color }}>
            <span className="legend-name"><span className="category-dot" />{name}</span>
            <span className="legend-value">{value} {value === 1 ? "event" : "events"}</span>
            <span className="legend-percent">{Math.round(value / total * 100)}%</span>
          </div>
        ))}
      </div>
      {!total && <p className="chart-note">No categorized events to display.</p>}
      {total < events.length && <p className="chart-note">{events.length - total} uncategorized. Percentages cover categorized events.</p>}
    </>
  );
};
export default EventGenresChart;
