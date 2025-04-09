"use client";

import { useConversation } from "@11labs/react";
import { useMemo } from "react";

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

type Medication = {
	id: string;
	name?: string;
	strength?: string;
	form?: string;
	doses?: Dose[];
	asNeeded?: number;
};

interface ConversationData {
	firstName?: string;
	lastName?: string;
	role?: "Primary User" | "Caregiver";
	dateOfBirth?: string;
	phone?: string;
	healthConditions?: Array<{ key: string; name: string }>;
	showMedications?: boolean;
	medications?: Medication[];
	currentMedicationId?: string;
}

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
const formatPhoneNumber = (phone: string): string => {
	if (!phone) return "";
	const cleaned = phone.replace(/\D/g, "");
	const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
	if (match) {
		return `(${match[1]}) ${match[2]}-${match[3]}`;
	}
	return phone;
};

const formatDoseTime = (timeOfDay: string): string => {
	if (!timeOfDay) return "";

	// Remove any spaces between time and AM/PM
	timeOfDay = timeOfDay.replace(/ (AM|PM)$/i, "$1");

	// If it's already in the correct format (H:MMAM or H:MMPM), just standardize the AM/PM case
	if (/^\d{1,2}:\d{2}(AM|PM)$/i.test(timeOfDay)) {
		return timeOfDay.toUpperCase();
	}

	// Log warning for invalid format
	console.warn(
		`Invalid time format received: "${timeOfDay}". Expected format: "H:MMAM" or "H:MMPM"`
	);
	return timeOfDay;
};

const formatName = (name: string | undefined): string => {
	if (!name) return "";
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
};

const DAY_MAP: Record<string, string> = {
	Monday: "Mon",
	Tuesday: "Tues",
	Wednesday: "Wed",
	Thursday: "Thurs",
	Friday: "Fri",
	Saturday: "Sat",
	Sunday: "Sun",
};

const FULL_DAY_MAP: Record<string, string> = {
	M: "Monday",
	T: "Tuesday",
	W: "Wednesday",
	Th: "Thursday",
	F: "Friday",
	S: "Saturday",
	Su: "Sunday",
};

const formatDayName = (day: string): string => DAY_MAP[day] || day;

const reconstructDays = (days: string[]): string[] => {
	if (days.length === 1) {
		const day = days[0];
		if (FULL_DAY_MAP[day]) {
			return [FULL_DAY_MAP[day]];
		}
	}

	const dayString = days.join("");
	const matches = dayString.match(/M|T|W|Th|F|S|Su/g) || [];
	return matches.map((match) => FULL_DAY_MAP[match] || match);
};

const groupDosesByFrequency = (
	doses: Dose[]
): Record<
	string,
	{ times: string[]; pillCount: number | Record<string, number> }
> => {
	const groups: Record<
		string,
		{ times: string[]; pillCount: number | Record<string, number> }
	> = {};

	if (!doses || doses.length === 0) {
		console.log("No doses to group");
		return groups;
	}

	console.log("Grouping doses:", doses);

	// Sort doses by time for consistent display
	const sortedDoses = [...doses].sort((a, b) => {
		if (!a.timeOfDay || !b.timeOfDay) return 0;
		const timeA = formatDoseTime(a.timeOfDay);
		const timeB = formatDoseTime(b.timeOfDay);
		return timeA.localeCompare(timeB);
	});

	// Group doses by their frequency
	sortedDoses.forEach((dose) => {
		if (!dose.timeOfDay || !Array.isArray(dose.specificDays)) {
			console.log("Skipping invalid dose:", dose);
			return;
		}

		const formattedTime = formatDoseTime(dose.timeOfDay);
		const fullDays = reconstructDays(dose.specificDays);

		console.log("Processing dose:", {
			time: formattedTime,
			days: fullDays,
			pillCount: dose.pillCount,
		});

		const isEveryday = fullDays.length === 7;
		const frequency = isEveryday
			? "Everyday"
			: fullDays
					.map((day) => formatDayName(day))
					.filter(Boolean)
					.sort((a, b) => {
						const dayOrder = [
							"Mon",
							"Tues",
							"Wed",
							"Thurs",
							"Fri",
							"Sat",
							"Sun",
						];
						return dayOrder.indexOf(a) - dayOrder.indexOf(b);
					})
					.join(", ");

		console.log("Determined frequency:", frequency);

		// Create or update the frequency group
		if (!groups[frequency]) {
			groups[frequency] = {
				times: [formattedTime],
				pillCount: dose.pillCount ?? 1,
			};
			console.log("Created new frequency group:", frequency, groups[frequency]);
		} else {
			// Add time if not already present
			if (!groups[frequency].times.includes(formattedTime)) {
				groups[frequency].times.push(formattedTime);
				// If pillCount was a number, convert to object
				if (typeof groups[frequency].pillCount === "number") {
					const defaultCount = groups[frequency].pillCount;
					groups[frequency].pillCount = groups[frequency].times.reduce(
						(acc, time) => ({
							...acc,
							[time]: defaultCount,
						}),
						{}
					);
				}
			}
			// Update pill count for this specific time
			if (typeof groups[frequency].pillCount === "object") {
				groups[frequency].pillCount[formattedTime] = dose.pillCount ?? 1;
			}
			console.log(
				"Updated existing frequency group:",
				frequency,
				groups[frequency]
			);
		}
	});

	// Sort times within each frequency group
	Object.values(groups).forEach((group) => {
		group.times.sort((timeA, timeB) => {
			const getTimeValue = (time: string) => {
				const isPM = time.endsWith("PM");
				const [hourStr, minuteStr] = time.replace(/(AM|PM)$/, "").split(":");
				let hour = parseInt(hourStr);
				const minute = parseInt(minuteStr || "0");

				// Adjust hour for PM and handle 12 AM/PM cases
				if (isPM && hour !== 12) hour += 12;
				if (!isPM && hour === 12) hour = 0;

				return hour * 60 + minute;
			};

			return getTimeValue(timeA) - getTimeValue(timeB);
		});
	});

	console.log("Final grouped doses:", groups);
	return groups;
};

const formatMedicationStrength = (strength: string | undefined): string => {
	if (!strength) return "";
	return strength
		.replace(/milligram/i, "mg")
		.replace(/microgram/i, "mcg")
		.replace(/gram/i, "g")
		.replace(/milliliter/i, "ml");
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
			userData.medications?.map((medication) => ({
				...medication,
				groupedDoses: medication.doses
					? groupDosesByFrequency(medication.doses)
					: {},
				displayName: `${medication.name} ${formatMedicationStrength(
					medication.strength
				)} (${medication.form})`,
			})),
		[userData.medications]
	);

	return (
		<div className="tablet-container">
			{conversation.status === "connected" && (
				<>
					{!showHealthConditions && (
						<div className="flex flex-col items-center w-full">
							<div className="flex flex-col items-center gap-[40px] w-full">
								<div className="text-center">
									<span className="text-white text-[48px] font-normal">
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
												{userData.role || "\u00A0"}
											</span>
										</div>

										<div className="flex items-center">
											<span
												className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
											>
												{userData.dateOfBirth || "\u00A0"}
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

					{showHealthConditions && !userData.showMedications && (
						<div className="flex flex-col items-center w-full">
							<div className={`text-center ${MARGINS.bottom60}`}>
								<span className="text-white text-[48px] font-normal">
									Health Conditions
								</span>
							</div>
							<div className="flex flex-col gap-[40px] items-center w-full">
								{userData.healthConditions?.map((condition) => (
									<div key={condition.key} className="text-center">
										<span
											className={`${TEXT_STYLES.white} ${TEXT_STYLES.base} border-b-2 border-[#F26C3A]`}
										>
											{condition.name}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{userData.showMedications && (
						<div className="flex flex-col w-full">
							<div className="text-center mb-[60px]">
								<span className="text-white text-[48px] font-normal">
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
																	key={index}
																	className="flex flex-col gap-2"
																>
																	{times.map((time, timeIndex) => (
																		<div
																			key={timeIndex}
																			className={`${TEXT_STYLES.white} ${TEXT_STYLES.base}`}
																		>
																			{frequency} {time}{" "}
																			{typeof pillCount === "object"
																				? `${pillCount[time]} pill${
																						pillCount[time] === 1 ? "" : "s"
																				  }/dose`
																				: `${pillCount} pill${
																						pillCount === 1 ? "" : "s"
																				  }/dose`}
																		</div>
																	))}
																</div>
															)
														)}
													</>
												)}
											</div>
										</div>

										{processedMedications &&
											medIndex === processedMedications.length - 1 &&
											medication.doses &&
											medication.doses.length > 0 && (
												<div className="flex flex-col w-full">
													<div
														className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${MARGINS.top40} ${MARGINS.bottom8}`}
													>
														{processedMedications.length + 1}. &lt;Name&gt;
													</div>
													<div
														className={`${TEXT_STYLES.orange} ${TEXT_STYLES.base} ${PADDING.left200}`}
													>
														&lt;Frequency&gt; &lt;Times&gt; &lt;Pills/dose&gt;
													</div>
												</div>
											)}
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
