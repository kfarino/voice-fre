"use client";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface CallButtonProps {
  status: "disconnected" | "connecting" | "connected" | "disconnecting";
  startCall: () => void;
  hasMediaAccess: boolean;
  requestMediaPermissions: () => void;
}

export function CallButton({
  status,
  startCall,
  hasMediaAccess,
  requestMediaPermissions,
}: CallButtonProps) {
  const [isInitializing, setIsInitializing] = useState(false);

  const onCallClick = async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      if (!hasMediaAccess) {
        await requestMediaPermissions();
      }
      await startCall();
    } catch (error) {
      console.error('Error initializing call:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Button
      onClick={onCallClick}
      disabled={status === "connecting"}
      className={cn(
        "relative w-[300px] h-[300px] rounded-full bg-gradient-to-b from-[#F26C3A] to-[#F26C3A]/80 shadow-lg",
        "hover:scale-[1.02] active:scale-[0.98] transition-transform",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex flex-col items-center justify-center",
        "after:absolute after:inset-[-2px] after:rounded-full after:blur-md",
        "after:bg-[#F26C3A] after:opacity-50 after:z-[-1]",
        "before:absolute before:inset-[-20px] before:rounded-full",
        "before:bg-[radial-gradient(circle,rgba(255,138,76,0.3)_0%,rgba(242,108,58,0.2)_40%,transparent_70%)]",
        "before:mix-blend-screen before:opacity-90 before:z-[-1]",
        "bg-gradient-to-b from-[#F26C3A] to-[#E85A2C]"
      )}
    >
      {isInitializing ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-24 w-24 animate-spin !text-white [&>*]:!text-white [&>path]:!stroke-white dark:!text-white dark:[&>*]:!text-white dark:[&>path]:!stroke-white" />
        </div>
      ) : status === "connecting" ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-24 w-24 animate-spin !text-white [&>*]:!text-white [&>path]:!stroke-white dark:!text-white dark:[&>*]:!text-white dark:[&>path]:!stroke-white" />
          <span className="!text-white" style={{ fontSize: '25px', color: '#FFFFFF' }}>Connecting...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2 [&>*]:text-white [&>*]:!text-white dark:[&>*]:!text-white">
          <div 
            className="font-light" 
            style={{ fontSize: '25px', color: '#FFFFFF' }}
          >
            Tap to
          </div>
          <div 
            className="font-semibold" 
            style={{ fontSize: '40px', color: '#FFFFFF' }}
          >
            Connect
          </div>
        </div>
      )}
    </Button>
  );
} 