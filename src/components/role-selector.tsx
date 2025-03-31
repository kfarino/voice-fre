import React from 'react';
import Image from 'next/image';

interface RoleSelectorProps {
  onRoleSelect: (role: "Primary User" | "Caregiver") => void;
  firstName: string;
}

export function RoleSelector({ onRoleSelect, firstName }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-normal mb-4 text-center">
          Welcome {firstName}!
        </h1>
        <h2 className="text-3xl font-normal mb-12 text-center">
          Who will be using the pill dispenser?
        </h2>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Primary User Option */}
          <button
            onClick={() => onRoleSelect("Primary User")}
            className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#1C2127] hover:bg-[#1C2127]/80 transition-all duration-200"
          >
            <div className="relative w-48 h-48 flex items-center justify-center">
              <Image
                src="/images/myself.png"
                alt="Myself icon"
                width={192}
                height={192}
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <span className="text-3xl font-normal">Myself</span>
          </button>

          {/* Caregiver Option */}
          <button
            onClick={() => onRoleSelect("Caregiver")}
            className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#1C2127] hover:bg-[#1C2127]/80 transition-all duration-200"
          >
            <div className="relative w-48 h-48 flex items-center justify-center">
              <Image
                src="/images/caregiver.png"
                alt="Loved one icon"
                width={192}
                height={192}
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <span className="text-3xl font-normal">Loved one</span>
          </button>
        </div>
      </div>
    </div>
  );
} 