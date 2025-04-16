"use client";

import React from "react";
import mockData from "./mockData";

type SharedUserDetails = {
	firstName: string;
	lastName: string;
	phoneNumber: string;
	stepCompleted: boolean; // at the end of the conversation user must confirm their details
};

export type PrimaryUserDetails = SharedUserDetails & {
	role: "Primary User";
	dateOfBirth: string; // Format: "January 11, 1990"
};

export type CaregiverDetails = SharedUserDetails & {
	role: "Caregiver";
	relationshipToLovedOne: string;
	lovedOne: {
		lovedOneFirstName: string;
		lovedOneLastName: string;
		lovedOneDateOfBirth: string; // Format: "January 11, 1990"
		lovedOneAlertPreferences: "SMS" | "Call" | "Push Notification"; // Array of alert preferences
		lovedOneAlertPhoneNumber?: string; // Optional field if alert_preferences is "SMS" or "Call"
	};
};

type UserDetails = PrimaryUserDetails | CaregiverDetails;

type HealthConditions = { conditions: Array<string>; stepCompleted: boolean };

type Medications = {
	medications: Array<{
		name?: string; // Medication name (e.g., "Metformin")
		strength?: string; // Strength with unit (e.g., "500mg", "10ml")
		form?: string; // Form (e.g., "Tablet", "Capsule")
		doses?: Array<{
			days: Array<"M" | "T" | "W" | "Th" | "F" | "S" | "Su">;
			timeOfDay: string; // Time of day (e.g., "8:00AM", "8:00PM")
			pillCount: number; // Number of pills to take at this time
		}>;
		asNeeded?: number; // Max number of pills allowed as needed, defaults to 0
	}>;
	stepCompleted: boolean;
};

export type ConversationData = {
	mockData?: boolean;
	userDetails?: Partial<UserDetails>;
	healthConditions?: HealthConditions;
	medications?: Medications;
};

const ConversationDataCtx = React.createContext<ConversationData>({});
const SetConversationDataCtx = React.createContext<
	React.Dispatch<React.SetStateAction<ConversationData>>
>(() => null);

const ConversationDataProvider: React.FC<{ children?: React.ReactNode }> = ({
	children,
}) => {
	const [state, dispatch] = React.useState<ConversationData>({});
	// const [state, dispatch] = React.useState<ConversationData>(mockData);

	return (
		<SetConversationDataCtx.Provider value={dispatch}>
			<ConversationDataCtx.Provider value={state}>
				{children}
			</ConversationDataCtx.Provider>
		</SetConversationDataCtx.Provider>
	);
};

export const useConversationData = () => React.useContext(ConversationDataCtx);
export const useSetConversationData = () =>
	React.useContext(SetConversationDataCtx);

export default ConversationDataProvider;
