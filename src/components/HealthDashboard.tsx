import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';
import DailyHealthDashboard from './DailyHealthDashboard';
import VitalTrends from './VitalTrends';
import MedicationAdherence from './MedicationAdherence';

interface HealthData {
  'Days ago': number;
  'Sleep (hrs)': number;
  'HR Spikes': number;
  'Steps': number;
  'Hydration (oz)': number;
  'Weight (lbs)': number;
  'Mood': string;
  'Lisinopril AM': number;
  'Lisinopril PM': number;
  'Metformin AM': number;
  'Metformin PM': number;
  'Atorvastatin PM': number;
  'Donepezil PM': number;
  'Acetaminophen (PRN)': number;
  'BP Systolic': number;
  'BP Diastolic': number;
  'Glucose (mg/dL)': number;
  'HRV (ms)': number;
}

const HealthDashboard: React.FC = () => {
  const [data, setData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/enhanced_comprehensive_patient_trend_data.csv');
        const csvText = await response.text();
        
        Papa.parse<HealthData>(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results: ParseResult<HealthData>) => {
            if (results.data && results.data.length > 0) {
              setData(results.data.filter(row => row['Days ago'] !== null));
            }
            setLoading(false);
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading health data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">No health data available</div>
      </div>
    );
  }

  // Sort data by 'Days ago' to ensure correct order
  const sortedData = [...data].sort((a, b) => a['Days ago'] - b['Days ago']);

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1C1C1C] border border-[#F26C3A]/20 rounded-xl p-4">
          <DailyHealthDashboard data={sortedData} />
        </div>
        <div className="bg-[#1C1C1C] border border-[#F26C3A]/20 rounded-xl p-4">
          <VitalTrends data={sortedData} />
        </div>
      </div>
      <div className="bg-[#1C1C1C] border border-[#F26C3A]/20 rounded-xl p-4">
        <MedicationAdherence data={sortedData} />
      </div>
    </div>
  );
};

export default HealthDashboard; 