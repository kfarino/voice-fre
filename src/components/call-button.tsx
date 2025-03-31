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
        "relative w-[300px] h-[300px] rounded-full shadow-lg border-0 outline-none",
        "hover:scale-[1.02] active:scale-[0.98] transition-transform",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex flex-col items-center justify-center",
        "after:absolute after:inset-0 after:rounded-full after:blur-[50px]",
        "after:bg-[#F26C3A] after:opacity-80 after:z-[-1]",
        "before:absolute before:inset-[-60px] before:rounded-full",
        "before:bg-[radial-gradient(circle,rgba(255,138,76,0.7)_0%,rgba(242,108,58,0.4)_40%,transparent_70%)]",
        "before:mix-blend-screen before:opacity-100 before:z-[-1]",
        "bg-[#F26C3A]",
        "shadow-[0_0_60px_20px_rgba(242,108,58,0.3),0_0_100px_60px_rgba(242,108,58,0.2),0_0_150px_80px_rgba(242,108,58,0.1)]"
      )}
      style={{
        background: 'linear-gradient(180deg, #F26C3A 0%, #E85A2C 100%)',
      }}
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