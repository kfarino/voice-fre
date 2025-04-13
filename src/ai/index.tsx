"use client";

import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Style from "./style.module.css";
import HealthDashboard from '@/components/HealthDashboard';
import Header from '@/components/Header';

type MessageType = {
	message: string;
	source: string;
	type?: 'speech_start' | 'speech_end';
};

const Ai: React.FC = () => {
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [hasAudioAccess, setHasAudioAccess] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const streamRef = useRef<MediaStream | null>(null);
	const conversation = useConversation();

	useEffect(() => {
		if (!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
			console.error("ElevenLabs API key is not configured");
			toast.error("ElevenLabs API key is missing");
		}
	}, []);

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

	const startCall = async () => {
		if (!hasAudioAccess) {
			await requestAudioPermissions();
		}

		try {
			await conversation?.startSession({
				agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '',
				onConnect: ({ conversationId: id }) => {
					console.log("Connected to agent:", id);
					setConversationId(id);
				},
				onError: (message: string) => {
					console.error("Connection error:", message);
					toast.error("Connection error occurred");
				},
				onMessage: (props: MessageType) => {
					console.log("Message received:", props);
					if (props.type === 'speech_start') {
						setIsSpeaking(true);
					} else if (props.type === 'speech_end') {
						setIsSpeaking(false);
					}
				},
				onDisconnect: () => {
					console.log("Disconnected from agent");
					setIsSpeaking(false);
					setConversationId(null);
				}
			});
		} catch (error: unknown) {
			console.error("Error starting call:", error);
			toast.error("Failed to start call");
		}
	};

	return (
		<div className={!conversationId ? 
			"flex items-center justify-center bg-[#000000] text-white h-full" : 
			"w-full bg-[#000000] text-white"
		}>
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
