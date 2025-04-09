"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
	ConversationData,
	useConversationData,
	useSetConversationData,
} from "@/context/ConversationData";

const Ai = () => {
	const conversation = useConversation();
	const [isCollecting, setIsCollecting] = useState(false);
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [hasAudioAccess, setHasAudioAccess] = useState(false);
	const [showCreateAccount, setShowCreateAccount] = useState(false);
	const [showHealthConditions, setShowHealthConditions] = useState(false);
	const [isConnectButtonFading, setIsConnectButtonFading] = useState(false);
	const streamRef = useRef<MediaStream | null>(null);
	const setConversationData = useSetConversationData();

	const moveToHealthConditions = useCallback(() => {
		console.log("Moving to health conditions screen");
		setShowCreateAccount(false);
		setShowHealthConditions(true);
	}, [setShowCreateAccount, setShowHealthConditions]);

	const moveBackToAccount = useCallback(() => {
		console.log("Moving back to account screen");
		setShowHealthConditions(false);
		setShowCreateAccount(true);
	}, [setShowCreateAccount, setShowHealthConditions]);

	console.log(conversation.status, conversation.isSpeaking);

	// Monitor connection status
	useEffect(() => {
		console.log("Connection status changed:", {
			status: conversation.status,
			showCreateAccount,
			showHealthConditions,
		});
		// Show create account screen only after connecting
		if (conversation.status === "connected") {
			if (!showCreateAccount && !showHealthConditions) {
				console.log("Setting showCreateAccount to true from useEffect");
				setShowCreateAccount(true);
			}
		} else {
			// Reset states when disconnected
			setShowCreateAccount(false);
			setShowHealthConditions(false);
		}
	}, [conversation.status, showCreateAccount, showHealthConditions]);

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
			// Reset all states to initial values
			setIsCollecting(false);
			setConversationId(null);
			setShowCreateAccount(false);
			setShowHealthConditions(false);
			setConversationData({});
		} catch (error) {
			console.error("Error ending call:", error);
			toast.error("Failed to end conversation");
		}
	};

	const startCall = async () => {
		setIsConnectButtonFading(true);

		try {
			if (!hasAudioAccess) {
				const stream = await requestAudioPermissions();
				if (!stream) {
					setIsConnectButtonFading(false);
					return;
				}
			}

			const handleUserDetails = async (
				parameters: ConversationData["userDetails"]
			) => {
				console.log("UserAccountInfo called with parameters:", parameters);

				if (!parameters) {
					console.error("No parameters received");
					return;
				}

				setConversationData((prev) => {
					const newData = {
						...prev,
						userDetails: {
							...(parameters.first_name && {
								first_name: parameters.first_name.trim(),
							}),
							...(parameters.last_name && {
								last_name: parameters.last_name.trim(),
							}),
							...(parameters.role && { role: parameters.role }),
							...("date_of_birth" in parameters && {
								date_of_birth: parameters.date_of_birth,
							}),
							...(parameters.phone_number && {
								phone_number: parameters.phone_number.replace(/\D/g, ""),
							}),

							isConfirmed: parameters.step_completed,
						},
					};

					// If all required fields are filled and isConfirmed is true, move to health conditions
					if (parameters?.step_completed) {
						console.log(
							"Account details confirmed, moving to health conditions"
						);
						moveToHealthConditions();
					}

					console.log("Updated userData:", newData);
					return newData;
				});
			};

			const sessionConfig = {
				agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
				clientTools: {
					UserAccountInfo: handleUserDetails,
				},
				onConnect: ({ conversationId }: { conversationId: string }) => {
					console.log("Connected to agent:", conversationId);
					setConversationId(conversationId);
					setIsCollecting(true);
					setShowCreateAccount(true);
				},
				onError: (error: any) => {
					console.error("Connection error:", error);
					toast.error("Connection error occurred");
					setIsConnectButtonFading(false);
					setIsCollecting(false);
					setConversationId(null);
				},
				onDisconnect: () => {
					console.log("Disconnected from agent");
					setIsCollecting(false);
					setConversationId(null);
					setShowCreateAccount(false);
					setShowHealthConditions(false);
				},
			} as const;

			const conversationId = await conversation?.startSession(
				sessionConfig as any
			);
		} catch (error) {
			console.error("Error starting call:", error);
			toast.error("Failed to start conversation");
			setIsCollecting(false);
			setConversationId(null);
			setIsConnectButtonFading(false);
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
		}
	};

	return (
		<button
			onClick={startCall}
			className="w-72 h-72 rounded-full bg-highlight text-white flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(242,108,58,0.6)] hover:bg-highlight/90 hover:shadow-[0_8px_35px_rgba(242,108,58,0.7)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-highlight/50 transform hover:scale-[1.02] active:scale-[0.98]"
		>
			<div className="text-center -mt-2">
				<p className="text-[25px] font-light ">
					{conversation.status === "disconnected"
						? "Tap to connect"
						: conversation.status === "connecting"
						? "Connecting..."
						: conversation.isSpeaking
						? "Ai talking..."
						: "Ai listening..."}
				</p>
			</div>

			<div className="relative mt-3">
				<div className="w-24 h-24 rounded-full bg-white/20 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />

				<div className="w-20 h-20 rounded-full bg-white/30 animate-blob absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
					<div
						className={`w-full h-full rounded-full flex items-center justify-center ${
							conversation.isSpeaking
								? "animate-wave"
								: conversation.status === "connected"
								? "animate-pulse"
								: ""
						}`}
					>
						<svg
							viewBox="0 0 200 200"
							className="w-16 h-16 fill-white"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M45.9,-52.2C59.7,-42.1,71.3,-28.8,74.9,-13.5C78.4,1.8,74,19,64.2,31.1C54.4,43.2,39.2,50.2,23.6,56.1C8,62,-7.9,66.9,-23.8,64.2C-39.7,61.6,-55.7,51.3,-66.8,35.9C-77.9,20.5,-84.3,0,-79.1,-16C-74,-31.9,-57.4,-43.5,-41.4,-53C-25.4,-62.5,-9.9,-70,5.1,-76C20.2,-81.9,40.4,-86.5,51,-75.4C61.5,-64.4,62.3,-37.7,45.9,-52.2Z"
								transform="translate(100 100)"
								className={`${conversation.isSpeaking ? "animate-morph" : ""}`}
							/>
						</svg>
					</div>
				</div>
			</div>
		</button>
	);
};

export default Ai;
