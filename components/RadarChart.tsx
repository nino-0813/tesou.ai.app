
import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';

interface RadarChartProps {
  data: {
    leadership: number;
    communication: number;
    logical: number;
    creative: number;
    empathy: number;
  };
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const chartData = [
    { subject: 'リーダーシップ', A: data.leadership, fullMark: 10 },
    { subject: 'コミュ力', A: data.communication, fullMark: 10 },
    { subject: '論理的思考', A: data.logical, fullMark: 10 },
    { subject: '創造力', A: data.creative, fullMark: 10 },
    { subject: '空気読み力', A: data.empathy, fullMark: 10 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#ffffff33" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffffcc', fontSize: 10 }} />
          <Radar
            name="Analysis"
            dataKey="A"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.6}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
