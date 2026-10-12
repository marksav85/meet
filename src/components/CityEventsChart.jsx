import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CityBar = ({ x, y, width, height, background, payload }) => {
  // Reserve space for the count on narrow screens; the SVG title retains the full city.
  const labelLength = Math.max(5, Math.floor((background.width - 80) / 7));
  const label = payload.city.length > labelLength ? `${payload.city.slice(0, labelLength - 1)}…` : payload.city;
  return (
  <g className="city-bar-row">
    <text x={x} y={y - 10} fill="var(--text)" fontSize="12"><title>{payload.city}</title>{label}</text>
    <text x={x + background.width} y={y - 10} textAnchor="end" fill="var(--text-secondary)" fontSize="12">{payload.count} {payload.count === 1 ? "event" : "events"}</text>
    <rect x={x} y={y} width={width} height={height} rx="4" fill="var(--secondary)" />
  </g>
  );
};

const CityEventsChart = ({ allLocations, events }) => {
  const data = allLocations.filter((location) => typeof location === "string" && location.trim()).map((location) => ({
    city: location.split(/, | - /)[0],
    count: events.filter((event) => event.location === location).length,
  })).filter(({ count }) => count > 0);
  if (!data.length) return <p className="chart-note">No city data to display.</p>;
  return (
    <div className="city-chart" role="img" aria-label={`Events by city: ${data.map(({ city, count }) => `${city}: ${count}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height={data.length * 52 + 16}>
        <BarChart data={data} layout="vertical" margin={{ top: 12, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, Math.max(...data.map(({ count }) => count))]} />
          <YAxis type="category" dataKey="city" hide />
          <Tooltip cursor={false} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} itemStyle={{ color: "var(--text)" }} formatter={(value) => [value, "Events"]} />
          <Bar dataKey="count" name="Events" barSize={8} shape={<CityBar />} background={{ fill: "var(--track)", radius: 4 }} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default CityEventsChart;
