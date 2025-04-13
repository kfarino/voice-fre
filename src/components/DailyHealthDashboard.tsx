import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

interface Props {
    data: any;
}

const DailyHealthDashboard: React.FC<Props> = ({ data }) => {
    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : Object.values(data || {});
    
    // Get last 7 days of data
    const weekData = dataArray
        .filter(day => day && typeof day === 'object' && day['Days ago'] <= 7)
        .sort((a, b) => a['Days ago'] - b['Days ago']);

    if (weekData.length === 0) {
        return <div className="text-white/80">No data available</div>;
    }

    // Calculate weekly averages and adherence
    const medications = ['Lisinopril AM', 'Lisinopril PM', 'Metformin AM', 'Metformin PM', 'Atorvastatin PM', 'Donepezil PM'];
    
    const weeklyAverages = {
        sleep: weekData.reduce((sum, day) => sum + day['Sleep (hrs)'], 0) / weekData.length,
        hrv: weekData.reduce((sum, day) => sum + day['HRV (ms)'], 0) / weekData.length,
        steps: weekData.reduce((sum, day) => sum + day['Steps'], 0) / weekData.length,
        hydration: weekData.reduce((sum, day) => sum + day['Hydration (oz)'], 0) / weekData.length,
        adherence: (weekData.reduce((sum, day) => {
            const dailyAdherence = medications.filter(med => day[med] === 1).length;
            return sum + (dailyAdherence / medications.length) * 100;
        }, 0) / weekData.length)
    };

    // Normalize values to 0-100 scale based on typical ranges from the data
    const normalizedData = [{
        name: 'Sleep',
        value: Math.min(100, (weeklyAverages.sleep / 8) * 100), // Target: 8 hours
        target: 100, // 8 hours sleep target
        actual: weeklyAverages.sleep.toFixed(1) + ' hrs',
        fullMark: 100
    }, {
        name: 'HRV',
        value: weeklyAverages.hrv,
        target: 60, // Target HRV
        actual: weeklyAverages.hrv.toFixed(0) + ' ms',
        fullMark: 100
    }, {
        name: 'Steps',
        value: Math.min(100, (weeklyAverages.steps / 3500) * 100),
        target: 100, // 3500 steps target
        actual: Math.round(weeklyAverages.steps).toLocaleString() + ' steps',
        fullMark: 100
    }, {
        name: 'Hydration',
        value: Math.min(100, (weeklyAverages.hydration / 64) * 100),
        target: 100, // 64 oz target
        actual: weeklyAverages.hydration.toFixed(0) + ' oz',
        fullMark: 100
    }, {
        name: 'Adherence',
        value: weeklyAverages.adherence,
        target: 100, // 100% adherence target
        actual: weeklyAverages.adherence.toFixed(0) + '%',
        fullMark: 100
    }];

    return (
        <div className="w-full">
            <h3 className="text-xl font-semibold mb-4 text-white/90">Weekly Dashboard</h3>
            <div className="flex flex-col h-[400px]">
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#F26C3A]"></div>
                        <span className="text-white/80 text-sm">Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white/30"></div>
                        <span className="text-white/80 text-sm">Target</span>
                    </div>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                            cx="50%" 
                            cy="50%" 
                            outerRadius="80%" 
                            data={normalizedData}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarGrid gridType="polygon" stroke="rgba(242, 108, 58, 0.2)" />
                            <PolarAngleAxis 
                                dataKey="name" 
                                tick={{ 
                                    fill: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: 12
                                }}
                                axisLine={{ stroke: 'rgba(242, 108, 58, 0.2)' }}
                            />
                            <PolarRadiusAxis 
                                angle={90}
                                domain={[0, 100]}
                                axisLine={{ stroke: 'rgba(242, 108, 58, 0.2)' }}
                                tick={{ 
                                    fill: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: 12,
                                    dy: 0
                                }}
                                tickFormatter={(value) => value === 100 ? '' : value}
                                orientation="middle"
                                tickCount={5}
                            />
                            <Radar
                                name="Target"
                                dataKey="target"
                                stroke="rgba(255, 255, 255, 0.3)"
                                fill="rgba(255, 255, 255, 0.1)"
                                fillOpacity={0.3}
                            />
                            <Radar
                                name="Health Metrics"
                                dataKey="value"
                                stroke="#F26C3A"
                                fill="#F26C3A"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DailyHealthDashboard; 