"use client";

import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Style from "./style.module.css";
import HealthDashboard from '@/components/HealthDashboard';
import Header from '@/components/Header';

const Ai = () => {
	const conversation = useConversation();
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [hasAudioAccess, setHasAudioAccess] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const streamRef = useRef<MediaStream | null>(null);

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
		if (!conversationId) {
			toast.error("Conversation not found");
			return;
		}

		try {
			await conversation?.endSession();
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
			setConversationId(null);
		} catch (error) {
			console.error("Error ending call:", error);
			toast.error("Failed to end conversation");
		}
	};

	const startCall = async () => {
		try {
			if (!hasAudioAccess) {
				const stream = await requestAudioPermissions();
				if (!stream) return;
			}

			const sessionConfig = {
				agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
				onConnect: ({ conversationId }: { conversationId: string }) => {
					console.log("Connected to agent:", conversationId);
					setConversationId(conversationId);
				},
				onError: (error: any) => {
					console.error("Connection error:", error);
					toast.error("Connection error occurred");
				},
				onAgentSpeechStart: () => {
					console.log("Agent speech started");
					setIsSpeaking(true);
				},
				onAgentSpeechEnd: () => {
					console.log("Agent speech ended");
					setIsSpeaking(false);
				},
				onMessage: (message: any) => {
					console.log("Message received:", message);
				},
				onDisconnect: () => {
					console.log("Disconnected from agent");
					setIsSpeaking(false);
					setConversationId(null);
				}
			};

			await conversation?.startSession(sessionConfig);
		} catch (error) {
			console.error("Error starting call:", error);
			toast.error("Failed to start conversation");
		}
	};

	return (
		<div className="w-full h-[calc(100vh-64px)] relative">
			{!conversationId && (
				<button
					onClick={conversation.status === "disconnected" ? startCall : undefined}
					className={`${Style.pulse} ${
						conversationId ? Style.pulseConnected : ""
					}`}
				>
					Tap to connect
				</button>
			)}

			{conversationId && (
				<div className="space-y-6">
					<Header isSpeaking={isSpeaking} />
					<div className="p-6">
						<HealthDashboard />
					</div>
				</div>
			)}
		</div>
	);
};

export default Ai;
