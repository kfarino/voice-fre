import React from 'react';

interface Props {
    data: any;
}

// Group medications by type
const medicationGroups = {
    'Blood Pressure': ['Lisinopril AM', 'Lisinopril PM'],
    'Diabetes': ['Metformin AM', 'Metformin PM'],
    'Cholesterol': ['Atorvastatin PM'],
    'Memory': ['Donepezil PM']
};

const MedicationAdherence: React.FC<Props> = ({ data }) => {
    // Ensure data is an array and sort it
    const dataArray = Array.isArray(data) ? data : Object.values(data || {});
    const sortedData = [...dataArray]
        .filter(day => day && typeof day === 'object')
        .sort((a, b) => b['Days ago'] - a['Days ago'])
        .slice(0, 7);

    // Get today's data (Days ago = 1)
    const today = sortedData.find(day => day['Days ago'] === 1) || sortedData[0];

    if (!today || sortedData.length === 0) {
        return <div className="text-white/80">No medication data available</div>;
    }

    return (
        <div className="w-full">
            <h3 className="text-xl font-semibold mb-6 text-white/90">Medication Adherence</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(medicationGroups).map(([group, meds]) => (
                    <div key={group} className="bg-[#1C1C1C]/50 rounded-lg p-6 border border-[#F26C3A]/20">
                        <h4 className="text-lg text-white/90 font-medium mb-4">{group}</h4>
                        <div className="space-y-6">
                            {meds.map(med => {
                                const weekHistory = sortedData.map(day => ({
                                    taken: day && typeof day === 'object' ? day[med] === 1 : false,
                                    label: day['Days ago'] === 1 ? 'Today' : 
                                           day['Days ago'] === 2 ? 'Yesterday' : 
                                           `${day['Days ago']-1}d ago`
                                }));

                                return (
                                    <div key={med} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-white/80">{med}</div>
                                            <div className={`text-sm px-3 py-1 rounded-full ${
                                                today && today[med] === 1 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {today && today[med] === 1 ? 'Taken today' : 'Missed today'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-white/40 w-16">Last 7d:</div>
                                            <div className="flex gap-1.5">
                                                {weekHistory.map((day, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className="relative group"
                                                    >
                                                        <div 
                                                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                                                                day.taken 
                                                                    ? 'bg-green-500 border-green-500' 
                                                                    : 'bg-transparent border-red-500/50'
                                                            }`}
                                                        />
                                                        <div className="hidden group-hover:block absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                                                                      text-xs bg-black/90 text-white px-2 py-1 rounded whitespace-nowrap z-10">
                                                            {day.label}: {day.taken ? 'Taken' : 'Missed'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MedicationAdherence; 