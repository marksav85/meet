import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const EventGenresChart = ({ events }) => {
  const genres = ["React", "JavaScript", "Node", "jQuery", "Angular"];
  const colors = ["#DD0000", "#00DD00", "#0000DD", "#DDDD00", "#DD00DD"];

  const data = genres.map((genre) => ({
    name: genre,
    value: events.filter((event) => typeof event.summary === "string" && event.summary.includes(genre)).length,
  }));

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius;
    const x = cx + radius * Math.cos(-midAngle * RADIAN) * 1.07;
    const y = cy + radius * Math.sin(-midAngle * RADIAN) * 1.07;
    return percent ? (
      <text
        x={x}
        y={y}
        fill="#8884d8"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${genres[index]} ${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <ResponsiveContainer width="99%" height={400}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          fill="#8884d8"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={130}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>

        <Legend
          verticalAlign="top"
          align="center"
          layout="horizontal"
          iconType="circle"
          wrapperStyle={{ paddingLeft: "50px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default EventGenresChart;
