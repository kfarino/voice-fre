"use client";

import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Style from "./style.module.css";
import HealthDashboard from '@/components/HealthDashboard';
import Header from '@/components/Header';

const Ai: React.FC = () => {
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [hasAudioAccess, setHasAudioAccess] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const streamRef = useRef<MediaStream | null>(null);
	const conversation = useConversation();

	useEffect(() => {
		// Check if API key is available
		if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
			console.error("ElevenLabs API key is not configured");
			toast.error("ElevenLabs API key is missing");
		}
	}, []);

	// Audio stream handling
	const requestAudioPermissions = async () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				},
			});
			streamRef.current = stream;
			setHasAudioAccess(true);
			return stream;
		} catch (err) {
			console.error(err);
			toast.error(
				"Please grant audio permissions in site settings to continue"
			);
			setHasAudioAccess(false);
			return null;
		}
	};

	// Cleanup audio stream on unmount
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => {
					track.stop();
				});
				streamRef.current = null;
			}
		};
	}, []);

	const endCall = async () => {
		try {
			await conversation?.endSession();
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
			setConversationId(null);
			setIsSpeaking(false);
		} catch (error) {
			console.error("Error ending call:", error);
			toast.error("Failed to end call");
		}
	};

	const startCall = async () => {
		if (!hasAudioAccess) {
			await requestAudioPermissions();
		}

		try {
			await conversation?.startSession({
				agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
				onConnect: ({ conversationId }) => {
					console.log("Connected to agent:", conversationId);
					setConversationId(conversationId);
				},
				onError: (message: string) => {
					console.error("Connection error:", message);
					toast.error("Connection error occurred");
				},
				onMessage: (message: any) => {
					console.log("Message received:", message);
					if (message.type === 'speech_start') {
						setIsSpeaking(true);
					} else if (message.type === 'speech_end') {
						setIsSpeaking(false);
					}
				},
				onDisconnect: () => {
					console.log("Disconnected from agent");
					setIsSpeaking(false);
					setConversationId(null);
				}
			});
		} catch (error) {
			console.error("Error starting call:", error);
			toast.error("Failed to start call");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
			{!conversationId ? (
				<div className={`${Style.pulse} flex items-center justify-center`} onClick={startCall}>
					Connect
				</div>
			) : (
				<>
					<Header isSpeaking={isSpeaking} />
					<HealthDashboard />
				</>
			)}
		</div>
	);
};

export default Ai;
