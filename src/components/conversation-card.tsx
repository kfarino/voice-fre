"use client";

import { useConversation } from "@11labs/react";
import { useMemo } from 'react';

// Constants
const TEXT_STYLES = {
  base: "text-[40px]",
  white: "text-white",
  orange: "text-[#F26C3A]",
} as const;

const PADDING = {
  left200: "pl-[200px]",
} as const;

const MARGINS = {
  bottom8: "mb-[8px]",
  bottom60: "mb-[60px]",
  top40: "mt-[40px]",
} as const;

// Types
type Dose = {
  pillCount?: number;
  timeOfDay?: string;
  specificDays?: string[];
  asNeeded?: boolean;
};

type Medication = {
  id: string;
  name?: string;
  strength?: string;
  form?: string;
  doses?: Dose[];
  asNeeded?: number;
};

interface ConversationData {
  firstName?: string;
  lastName?: string;
  role?: "Primary User" | "Caregiver";
  dateOfBirth?: string;
  phone?: string;
  healthConditions?: Array<{ key: string; name: string }>;
  showMedications?: boolean;
  medications?: Medication[];
  currentMedicationId?: string;
}

interface ConversationCardProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  conversation: ReturnType<typeof useConversation>;
  endCall: () => void;
  userData: ConversationData;
  startCall: () => void;
  hasAudioAccess: boolean;
  requestAudioPermissions: () => void;
  onNext: () => void;
  onBack: () => void;
  showHealthConditions?: boolean;
}

// Helper functions
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

const formatDoseTime = (timeOfDay: string): string => {
  if (!timeOfDay) return '';
  
  // Convert single digit to proper time format
  const timeNum = parseInt(timeOfDay);
  if (!isNaN(timeNum)) {
    if (timeNum === 0 || timeNum === 24) return '12:00AM';
    if (timeNum === 12) {
      // For 12, we need the AM/PM designation from the input
      const isPM = timeOfDay.toUpperCase().includes('PM');
      return `12:00${isPM ? 'PM' : 'AM'}`;
    }
    return timeNum < 12 ? `${timeNum}:00AM` : `${timeNum - 12}:00PM`;
  }
  
  // If it already has minutes but no period (e.g. "8:00"), add AM/PM
  if (/^\d+:\d+$/.test(timeOfDay)) {
    const hour = parseInt(timeOfDay.split(':')[0]);
    if (hour === 0 || hour === 24) return `12:${timeOfDay.split(':')[1]}AM`;
    if (hour === 12) {
      // For 12, we need the AM/PM designation from the input
      const isPM = timeOfDay.toUpperCase().includes('PM');
      return `${timeOfDay}${isPM ? 'PM' : 'AM'}`;
    }
    return hour < 12 ? `${timeOfDay}AM` : `${hour - 12}:${timeOfDay.split(':')[1]}PM`;
  }
  
  // If it has a space between time and period (e.g. "8:00 AM"), remove space
  if (/ (AM|PM)$/.test(timeOfDay)) {
    return timeOfDay.replace(/ (AM|PM)$/, '$1');
  }
  
  return timeOfDay;
};

const formatName = (name: string | undefined): string => {
  if (!name) return '';
  return name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const DAY_MAP: Record<string, string> = {
  'Monday': 'Mon',
  'Tuesday': 'Tues',
  'Wednesday': 'Wed',
  'Thursday': 'Thurs',
  'Friday': 'Fri',
  'Saturday': 'Sat',
  'Sunday': 'Sun'
};

const FULL_DAY_MAP: Record<string, string> = {
  'M': 'Monday',
  'T': 'Tuesday',
  'W': 'Wednesday',
  'Th': 'Thursday',
  'F': 'Friday',
  'S': 'Saturday',
  'Su': 'Sunday'
};

const formatDayName = (day: string): string => DAY_MAP[day] || day;

const reconstructDays = (days: string[]): string[] => {
  if (days.length === 1 && days[0] === 'A') {
    return ['As-needed'];
  }

  if (days.length === 1) {
    const day = days[0];
    if (FULL_DAY_MAP[day]) {
      return [FULL_DAY_MAP[day]];
    }
  }

  const dayString = days.join('');
  const matches = dayString.match(/M|T|W|Th|F|S|Su/g) || [];
  return matches.map(match => FULL_DAY_MAP[match] || match);
};

const groupDosesByFrequency = (doses: Dose[]): Record<string, { times: string[], pillCount: number }> => {
  const groups: Record<string, { times: string[], pillCount: number }> = {};
  const timeToFrequency: Record<string, string> = {}; // Track which frequency group each time belongs to
  
  // Sort doses by most recent first (assuming newer doses are added to the end of the array)
  const sortedDoses = [...doses].reverse();
  
  // First pass: identify the most recent frequency for each time
  sortedDoses.forEach(dose => {
    if (!dose.timeOfDay || !Array.isArray(dose.specificDays)) return;
    
    const formattedTime = formatDoseTime(dose.timeOfDay);
    const fullDays = reconstructDays(dose.specificDays);
    
    if (fullDays.length === 1 && fullDays[0] === 'As-needed') {
      timeToFrequency[formattedTime] = 'As-needed';
    } else {
      const isEveryday = fullDays.length === 7;
      const frequency = isEveryday
        ? "Everyday"
        : fullDays
            .map(day => formatDayName(day))
            .filter(Boolean)
            .join(", ");
      
      timeToFrequency[formattedTime] = frequency;
    }
  });
  
  // Second pass: group doses by their most recent frequency
  sortedDoses.forEach(dose => {
    if (!dose.pillCount || !dose.timeOfDay || !Array.isArray(dose.specificDays)) return;
    
    const formattedTime = formatDoseTime(dose.timeOfDay);
    const currentFrequency = timeToFrequency[formattedTime];
    
    if (!currentFrequency) return;
    
    if (currentFrequency === 'As-needed') {
      groups[currentFrequency] = { times: [], pillCount: dose.pillCount };
      return;
    }
    
    // Create or update the frequency group
    if (!groups[currentFrequency]) {
      groups[currentFrequency] = {
        times: [formattedTime],
        pillCount: dose.pillCount
      };
    } else {
      // Update pill count with most recent value
      groups[currentFrequency].pillCount = dose.pillCount;
      // Add time if not already present
      if (!groups[currentFrequency].times.includes(formattedTime)) {
        groups[currentFrequency].times.push(formattedTime);
      }
    }
  });

  // Sort times within each frequency group
  Object.values(groups).forEach(group => {
    group.times.sort((timeA, timeB) => {
      const getTimeValue = (time: string) => {
        const isPM = time.endsWith('PM');
        const [hourStr, minuteStr] = time.replace(/(AM|PM)$/, '').split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr || '0');
        
        // Adjust hour for PM and handle 12 AM/PM cases
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        
        return hour * 60 + minute;
      };
      
      return getTimeValue(timeA) - getTimeValue(timeB);
    });
  });

  return groups;
};

export function ConversationCard({
  conversation,
  userData,
  showHealthConditions = false,
}: ConversationCardProps) {

  // Memoize expensive computations
  const formattedName = useMemo(() => 
    `${formatName(userData.firstName)} ${formatName(userData.lastName)}`.trim(),
    [userData.firstName, userData.lastName]
  );

  const formattedPhone = useMemo(() => 
    userData.phone ? formatPhoneNumber(userData.phone) : '\u00A0',
    [userData.phone]
  );

  return (
    <div className="tablet-container">
      {conversation.status === "connected" && (
        <>
          {!showHealthConditions && !userData.showMedications && (
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center gap-[40px] w-full">
                <div className="text-center">
                  <span className="text-white text-[48px] font-normal">Create Your Account</span>
                </div>
                
                <div className="flex flex-col gap-[20px] w-full items-center">
                  <div className="flex flex-col gap-[40px] items-center">
                    <div className="flex items-center">
                      <span className="text-white/60 text-[40px]">📝 Name</span>
                      <span className="text-white/60 text-[40px] pr-[15px]">:</span>
                      <span className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}>
                        {formattedName}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-white/60 text-[40px]">👤 Role</span>
                      <span className="text-white/60 text-[40px] pr-[15px]">:</span>
                      <span className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}>
                        {userData.role || '\u00A0'}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-white/60 text-[40px]">🎂 Date of Birth</span>
                      <span className="text-white/60 text-[40px] pr-[15px]">:</span>
                      <span className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}>
                        {userData.dateOfBirth || '\u00A0'}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-white/60 text-[40px]">📞 Phone</span>
                      <span className="text-white/60 text-[40px] pr-[15px]">:</span>
                      <span className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}>
                        {formattedPhone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showHealthConditions && !userData.showMedications && (
            <div className="flex flex-col items-center w-full">
              <div className={`text-center ${MARGINS.bottom60}`}>
                <span className="text-white text-[48px] font-normal">Health Conditions</span>
              </div>
              <div className="flex flex-col gap-[40px] items-center w-full">
                {userData.healthConditions?.map((condition) => (
                  <div key={condition.key} className="text-center">
                    <span className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}>
                      {condition.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {userData.showMedications && (
            <div className="flex flex-col w-full">
              <div className={`text-center ${MARGINS.bottom60}`}>
                <span className="text-white text-[48px] font-normal">Medication Details</span>
              </div>
              <div className="flex flex-col gap-[60px] w-full pl-[200px]">
                {(!userData.medications || userData.medications.length === 0) && (
                  <div className="flex flex-col w-full">
                    <div className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${MARGINS.bottom8}`}>&lt;Name&gt;</div>
                    <div className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${PADDING.left200}`}>
                      &lt;Frequency&gt; &lt;Times&gt; &lt;Pills/dose&gt;
                    </div>
                  </div>
                )}
                
                {userData.medications?.map((medication, medIndex) => (
                  <div key={medication.id}>
                    <div className="mb-8">
                      <div className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} ${MARGINS.bottom8}`}>
                        {medIndex + 1}. {medication.name} {medication.strength?.replace('milligram', 'mg')} ({medication.form})
                      </div>
                      <div className={PADDING.left200}>
                        {(!medication.doses || medication.doses.length === 0) ? (
                          <div className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base}`}>
                            &lt;Frequency&gt; &lt;Times&gt; &lt;Pills/dose&gt;
                          </div>
                        ) : (
                          Object.entries(groupDosesByFrequency(medication.doses)).map(([frequency, { times, pillCount }], index) => {
                            if (frequency === 'As-needed') {
                              return (
                                <div key={index} className={`${TEXT_STYLES.white} ${TEXT_STYLES.base}`}>
                                  As-needed: {pillCount} {pillCount === 1 ? 'pill' : 'pills'}/day
                                </div>
                              );
                            }

                            return (
                              <div key={index} className={`${TEXT_STYLES.white} ${TEXT_STYLES.base}`}>
                                {frequency} {times.sort().join(", ")} {pillCount} pills/dose
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {userData.medications && medIndex === userData.medications.length - 1 && medication.doses && medication.doses.length > 0 && (
                      <div className="flex flex-col w-full">
                        <div className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${MARGINS.top40} ${MARGINS.bottom8}`}>
                          {userData.medications.length + 1}. &lt;Name&gt;
                        </div>
                        <div className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${PADDING.left200}`}>
                          &lt;Frequency&gt; &lt;Times&gt; &lt;Pills/dose&gt;
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 