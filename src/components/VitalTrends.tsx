import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Text,
} from 'recharts';

interface Props {
    data: any[];
}

const VitalTrends: React.FC<Props> = ({ data }) => {
    // Format days ago to just the number
    const formatDaysAgo = (days: number) => {
        if (days === 1) return '0';
        return `${days-1}`;
    };

    // Custom X Axis Label component
    const CustomXAxisTick = ({ x, y, payload }: any) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontSize={12}
                >
                    {formatDaysAgo(payload.value)}
                </text>
            </g>
        );
    };

    // Find days with missed medications
    const missedMedDays = data.map(day => ({
        daysAgo: day['Days ago'],
        missed: ['Lisinopril PM', 'Metformin PM', 'Atorvastatin PM'].some(med => day[med] === 0),
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dayData = data.find(d => d['Days ago'] === label);
            return (
                <div className="bg-gray-900/90 p-3 rounded-lg shadow-lg border border-white/10">
                    <p className="text-white font-medium mb-1">
                        {label === 1 ? 'Today' : 
                         label === 2 ? 'Yesterday' : 
                         `${label-1} days ago`}
                    </p>
                    <p className="text-[#F26C3A]">
                        BP: {dayData['BP Systolic']}/{dayData['BP Diastolic']}
                        <span className="text-white/60 text-xs ml-2">(Target: 120/80)</span>
                    </p>
                    <p className="text-[#F26C3A]/60">
                        Glucose: {dayData['Glucose (mg/dL)']} mg/dL
                        <span className="text-white/60 text-xs ml-2">(Target: 100)</span>
                    </p>
                    <p className="text-white/80 mt-1">Mood: {dayData.Mood}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[400px] w-full">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Vital Trends</h3>
            <div className="flex flex-col h-[calc(100%-2rem)]">
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F26C3A]"></div>
                        <span className="text-white/80 text-sm">Blood Pressure</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F26C3A]/60"></div>
                        <span className="text-white/80 text-sm">Blood Sugar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-[2px] w-6 bg-white/30"></div>
                        <span className="text-white/80 text-sm">Target</span>
                    </div>
                </div>
                <div className="flex-1 relative">
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
                        Days ago
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 25
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(242, 108, 58, 0.1)" />
                            <XAxis
                                dataKey="Days ago"
                                tick={<CustomXAxisTick />}
                                stroke="rgba(242, 108, 58, 0.2)"
                                fontSize={12}
                            />
                            <YAxis
                                yAxisId="left"
                                domain={[60, 180]}
                                tick={{ 
                                    fill: 'rgba(255,255,255,0.8)',
                                    fontSize: 12
                                }}
                                stroke="rgba(242, 108, 58, 0.2)"
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[80, 200]}
                                tick={{ 
                                    fill: 'rgba(255,255,255,0.8)',
                                    fontSize: 12
                                }}
                                stroke="rgba(242, 108, 58, 0.2)"
                            />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Target reference lines */}
                            <ReferenceLine 
                                y={120} 
                                yAxisId="left" 
                                stroke="rgba(255, 255, 255, 0.3)" 
                                strokeDasharray="3 3"
                                label={{
                                    value: "Target BP: 120/80",
                                    position: "center",
                                    fill: "rgba(255, 255, 255, 0.5)",
                                    fontSize: 11,
                                    dy: -10
                                }}
                            />
                            <ReferenceLine 
                                y={100} 
                                yAxisId="right" 
                                stroke="rgba(255, 255, 255, 0.3)" 
                                strokeDasharray="3 3"
                                label={{
                                    value: "Target Glucose: 100",
                                    position: "center",
                                    fill: "rgba(255, 255, 255, 0.5)",
                                    fontSize: 11,
                                    dy: 15
                                }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="BP Systolic"
                                name="Blood Pressure"
                                stroke="#F26C3A"
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="Glucose (mg/dL)"
                                name="Blood Sugar"
                                stroke="rgba(242, 108, 58, 0.6)"
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VitalTrends; 