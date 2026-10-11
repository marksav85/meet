import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

import { EVENT_CATEGORIES, getEventCategory } from "../event-categories";

const EventGenresChart = ({ events }) => {
  const categories = events.map(getEventCategory);
  const data = EVENT_CATEGORIES.map(({ name }) => ({
    name,
    value: categories.filter((category) => category === name).length,
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
        {`${data[index].name} ${(percent * 100).toFixed(0)}%`}
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
            <Cell key={`cell-${index}`} fill={EVENT_CATEGORIES[index].color} />
          ))}
        </Pie>

        <Legend
          itemSorter={null}
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
