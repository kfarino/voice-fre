"use client";

import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useSetAppState } from "@/context/AppState";
import {
	ConversationData,
	useSetConversationData,
} from "@/context/ConversationData";
import Style from "./style.module.css";

const Ai = () => {
	const setAppState = useSetAppState();
	const conversation = useConversation();
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [hasAudioAccess, setHasAudioAccess] = useState(false);
	const streamRef = useRef<MediaStream | null>(null);
	const setConversationData = useSetConversationData();

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

	const handleEndCall = async () => {
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
			// Reset all states to initial values
			setConversationId(null);
			setConversationData({});
		} catch (error) {
			console.error("Error ending call:", error);
			toast.error("Failed to end conversation");
		}
	};

	const startCall = async () => {
		try {
			if (!hasAudioAccess) {
				const stream = await requestAudioPermissions();
				if (!stream) {
					return;
				}
			}

			const handleUserDetails = async (
				parameters: ConversationData["userDetails"]
			) => {
				console.log("handleUserDetails:", parameters);

				if (!parameters) {
					console.error("No parameters received");
					return;
				}

				setConversationData((prev) => {
					const newData = {
						...prev,
						userDetails: {
							...parameters,
						},
					};

					// If all required fields are filled and isConfirmed is true, move to health conditions
					if (parameters?.stepCompleted) {
						setAppState({
							step: "healthConditions",
						});
					}

					return newData;
				});
			};

			const handleHealthConditions = async (
				parameters: ConversationData["healthConditions"]
			) => {
				console.log("handleHealthConditions:", parameters);

				if (!parameters) {
					console.error("No parameters received");
					return;
				}

				setConversationData((prev) => ({
					...prev,
					healthConditions: {
						...(parameters.conditions && {
							conditions: parameters.conditions,
						}),
						stepCompleted: parameters.stepCompleted,
					},
				}));

				setAppState({ step: "healthConditions" });
			};

			const handleMedications = async (
				parameters: ConversationData["medications"]
			) => {
				console.log("handleMedications:", parameters);

				if (!parameters) {
					console.error("No parameters received");
					return;
				}

				setConversationData((prev) => ({
					...prev,
					medications: {
						...(parameters.medications && {
							medications: parameters.medications,
						}),
						stepCompleted: parameters.stepCompleted,
					},
				}));

				setAppState({ step: "medications" });
			};

			const sessionConfig = {
				agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
				clientTools: {
					UserAccountInfo: handleUserDetails,
					HealthConditions: handleHealthConditions,
					Medications: handleMedications,
				},
				onConnect: ({ conversationId }: { conversationId: string }) => {
					console.log("Connected to agent:", conversationId);
					setConversationId(conversationId);
					setAppState({
						step: "userDetails",
					});
				},
				onError: (error: Error) => {
					console.error("Connection error:", error);
					toast.error("Connection error occurred");
					setConversationId(null);
					setAppState({ step: "init" });
				},
				onDisconnect: () => {
					console.log("Disconnected from agent");
					setConversationId(null);
					setAppState({ step: "init" });
				},
			};

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await conversation?.startSession(sessionConfig as any);
		} catch (error) {
			console.error("Error starting call:", error);
			toast.error("Failed to start conversation");
			setConversationId(null);
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
		}
	};

	return (
		<>
			<button
				onClick={conversation.status === "disconnected" ? startCall : handleEndCall}
				className={`${Style.pulse} ${
					conversation.status === "connected" ? Style.pulseConnected : ""
				}`}
			>
				{conversation.status === "disconnected"
					? "Tap to connect"
					: conversation.status === "connecting"
					? "Connecting..."
					: ""}
			</button>

			{conversation.status === "connected" && (
				<div
					className={`${Style.bars} ${
						conversation.isSpeaking ? Style.speaking : ""
					}`}
				>
					<div />
					<div />
					<div />
					<div />
					<div />
					<div />
					<div />
					<div />
				</div>
			)}
		</>
	);
};

export default Ai;
