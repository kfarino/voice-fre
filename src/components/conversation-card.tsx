"use client";

import { useConversation } from "@11labs/react";

interface ConversationData {
  firstName?: string;
  lastName?: string;
  role?: "Primary User" | "Caregiver";
  dateOfBirth?: string;
  phone?: string;
  healthConditions?: Array<{ key: string; name: string }>;
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

export function ConversationCard({
  conversation,
  endCall,
  userData,
  showHealthConditions = false,
}: ConversationCardProps) {
  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <div className="tablet-container">
      {conversation.status === "connected" && (
        <>
          {!showHealthConditions ? (
            // Account Creation Screen
            <div className="space-y-6">
              {/* User Data Display */}
              <div className="flex flex-col gap-[20px] max-w-[800px] mx-auto">
                <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-[50px]">
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>Name</span>
                  </div>
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div>
                    {(userData.firstName || userData.lastName) ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2" style={{ fontSize: '25px' }}>
                        {userData.firstName} {userData.lastName}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '25px' }}>&nbsp;</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-[50px]">
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>Role</span>
                  </div>
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div>
                    {userData.role ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2" style={{ fontSize: '25px' }}>
                        {userData.role}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '25px' }}>&nbsp;</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-[50px]">
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>Date of Birth</span>
                  </div>
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div>
                    {userData.dateOfBirth ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2" style={{ fontSize: '25px' }}>
                        {userData.dateOfBirth}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '25px' }}>&nbsp;</span>}
                  </div>
                </div>
                <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-[50px]">
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>Phone</span>
                  </div>
                  <div>
                    <span className="text-white/60" style={{ fontSize: '40px' }}>:</span>
                  </div>
                  <div>
                    {userData.phone ? (
                      <span className="inline-block border-b-2 border-[#F26C3A] pb-2" style={{ fontSize: '25px' }}>
                        {formatPhoneNumber(userData.phone)}
                      </span>
                    ) : <span className="inline-block pb-2" style={{ fontSize: '25px' }}>&nbsp;</span>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Health Conditions Screen
            <div className="flex flex-col min-h-[400px]">
              {/* Health Conditions List */}
              <div className="space-y-6">
                {userData.healthConditions && userData.healthConditions.length > 0 && (
                  userData.healthConditions.map((condition) => (
                    <div key={condition.key}>
                      <div className="field-value">{condition.name}</div>
                    </div>
                  ))
                )}
              </div>

              {/* End Conversation Button with fixed spacing */}
              <div className="flex-1 flex items-center justify-center mt-[500px]">
                <button
                  onClick={endCall}
                  className="w-[320px] h-[80px] bg-[#F26C3A] !text-white font-medium rounded-full hover:bg-[#F26C3A]/90 transition-colors border-0 flex items-center justify-center"
                  style={{ fontSize: '25px' }}
                >
                  I took it
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 