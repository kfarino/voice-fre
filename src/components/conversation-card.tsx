"use client";

import { useConversation } from "@11labs/react";
import { useMemo } from "react";
import { ConversationData, PrimaryUserDetails, CaregiverDetails } from "@/context/ConversationData";

// Constants
const TEXT_STYLES = {
	base: "text-[40px]",
	white: "text-white",
	orange: "text-[#F26C3A]",
} as const;

const PADDING = {
	left200: "pl-[200px]",
} as const;

const MARGINS = {
	bottom8: "mb-[8px]",
	bottom60: "mb-[60px]",
	top40: "mt-[40px]",
} as const;

// Types
type Dose = {
	pillCount?: number;
	timeOfDay?: string;
	specificDays?: string[];
	asNeeded?: boolean;
};

interface ConversationCardProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	conversation: ReturnType<typeof useConversation>;
	endCall: () => void;
	userData?: ConversationData;
	startCall: () => void;
	hasAudioAccess: boolean;
	requestAudioPermissions: () => void;
	onNext: () => void;
	onBack: () => void;
	showHealthConditions?: boolean;
}

// Helper functions
const formatFrequency = (frequency: string): string => {
	switch (frequency) {
		case "daily":
			return "Daily";
		case "weekly":
			return "Weekly";
		case "monthly":
			return "Monthly";
		default:
			return frequency;
	}
};

const formatMedicationStrength = (strength?: string): string => {
	if (!strength) return "";
	return strength;
};

const groupDosesByFrequency = (doses: Dose[]): Record<string, { times: string[]; pillCount: number }> => {
	const grouped: Record<string, { times: string[]; pillCount: number }> = {};
	
	doses.forEach((dose) => {
		if (!dose.timeOfDay || !dose.pillCount) return;
		
		const frequency = dose.specificDays?.length === 7 ? "daily" : "weekly";
		if (!grouped[frequency]) {
			grouped[frequency] = { times: [], pillCount: dose.pillCount };
		}
		grouped[frequency].times.push(dose.timeOfDay);
	});
	
	return grouped;
};

const BouncingPills = () => {
	return (
		<div className="flex justify-center items-center gap-[60px] mt-8">
			{[...Array(5)].map((_, i) => (
				<span
					key={i}
					className="inline-block"
					style={{
						animation: "bounce 1s infinite",
						animationDelay: `${i * 0.2}s`,
						display: "inline-block",
						fontSize: "40px",
					}}
				>
					💊
				</span>
			))}
			<style jsx>{`
				@keyframes bounce {
					0%,
					100% {
						transform: translateY(0);
						animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
					}
					50% {
						transform: translateY(-25px);
						animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
					}
				}
			`}</style>
		</div>
	);
};

export function ConversationCard({
	conversation,
	userData,
	showHealthConditions = false,
}: ConversationCardProps) {
	// Memoize medications data processing
	const processedMedications = useMemo(
		() =>
			userData?.medications?.medications?.map((medication, index) => ({
				id: `med-${index}`,
				...medication,
				groupedDoses: medication.doses
					? groupDosesByFrequency(medication.doses)
					: {},
				displayName: `${medication.name} ${formatMedicationStrength(
					medication.strength
				)}`,
			})) ?? [],
		[userData?.medications?.medications]
	);

	const formattedName = userData?.userDetails
		? `${userData.userDetails.firstName} ${userData.userDetails.lastName}`
		: "N/A";

	const formattedPhone = userData?.userDetails?.phoneNumber ?? "N/A";

	const formattedDateOfBirth = (() => {
		const details = userData?.userDetails;
		if (!details) return "N/A";
		
		if (details.role === "Primary User") {
			return (details as PrimaryUserDetails).dateOfBirth ?? "N/A";
		}
		
		if (details.role === "Caregiver") {
			return (details as CaregiverDetails).lovedOne.lovedOneDateOfBirth ?? "N/A";
		}
		
		return "N/A";
	})();

	const formattedRole = userData?.userDetails?.role ?? "N/A";

	const hasMedications = Boolean(userData?.medications?.medications?.length);

	return (
		<div className="tablet-container">
			{conversation.status === "connected" && (
				<>
					{!showHealthConditions && (
						<div className="flex flex-col items-center w-full">
							<div className="flex flex-col items-center gap-[40px] w-full">
								<div className="text-center">
									<span className="text-white text-[40px] font-normal">
										Create Your Account
									</span>
								</div>

								<div className="flex flex-col gap-[40px] items-center">
									<div className="flex flex-col gap-[40px] items-center">
										<div className="flex items-center">
											<span
												className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
											>
												{formattedName || "\u00A0"}
											</span>
										</div>

										<div className="flex items-center">
											<span
												className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
											>
												{formattedRole}
											</span>
										</div>

										<div className="flex items-center">
											<span
												className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
											>
												{formattedDateOfBirth}
											</span>
										</div>

										<div className="flex items-center">
											<span
												className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
											>
												{formattedPhone}
											</span>
										</div>
									</div>
									<BouncingPills />
								</div>
							</div>
						</div>
					)}

					{showHealthConditions && !hasMedications && (
						<div className="flex flex-col items-center w-full">
							<div className={`text-center ${MARGINS.bottom60}`}>
								<span className="text-white text-[40px] font-normal">
									Health Conditions
								</span>
							</div>
							<div className="flex flex-col gap-[40px] items-center w-full">
								{userData?.healthConditions?.conditions?.map((condition, index) => (
									<div key={`condition-${index}`} className="text-center">
										<span
											className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
										>
											{condition}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{hasMedications && (
						<div className="flex flex-col w-full">
							<div className="text-center mb-[60px]">
								<span className="text-white text-[40px] font-normal">
									Medication Details
								</span>
							</div>
							<div className="flex flex-col gap-[60px] w-full pl-[200px]">
								{(!processedMedications ||
									processedMedications.length === 0) && (
									<div className="flex flex-col w-full">
										<div
											className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${MARGINS.bottom8}`}
										>
											&lt;Name&gt;
										</div>
										<div
											className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${PADDING.left200}`}
										>
											&lt;Frequency&gt; &lt;Times&gt; &lt;Pills/dose&gt;
										</div>
									</div>
								)}

								{processedMedications?.map((medication, medIndex) => (
									<div key={medication.id}>
										<div className="mb-8">
											<div
												className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} ${MARGINS.bottom8}`}
											>
												{medIndex + 1}. {medication.displayName}
											</div>
											<div className={PADDING.left200}>
												{!medication.doses || medication.doses.length === 0 ? (
													<div
														className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base}`}
													>
														&lt;Frequency&gt; &lt;Times&gt; &lt;Pills/dose&gt;
													</div>
												) : (
													<>
														{(medication.asNeeded ?? 0) > 0 && (
															<div
																className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} ${MARGINS.bottom8}`}
															>
																As-needed: {medication.asNeeded}{" "}
																{medication.asNeeded === 1 ? "pill" : "pills"}
																/day
															</div>
														)}
														{Object.entries(medication.groupedDoses).map(
															([frequency, { times, pillCount }], index) => (
																<div
																	key={`${medication.id}-${index}`}
																	className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} ${MARGINS.bottom8}`}
																>
																	{formatFrequency(frequency)}:{" "}
																	{times.join(", ")} ({pillCount}{" "}
																	{pillCount === 1 ? "pill" : "pills"})
																</div>
															)
														)}
													</>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
