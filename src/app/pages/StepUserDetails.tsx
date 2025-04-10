import React, { useState } from "react";
import { User, Calendar, BellRing, Phone } from "lucide-react";
import { useConversationData } from "@/context/ConversationData";

const StepUserDetails: React.FC = () => {
	const conversationData = useConversationData();

	if (!conversationData.userDetails) {
		return null;
	}

	return (
		<div className="flex h-full mb-6">
			{/* User Profile - Takes full width for Primary User, half width for Caregiver */}
			<div
				className={`${
					conversationData.userDetails.role === "Primary User"
						? "w-full"
						: "w-1/2 pr-2"
				} flex flex-col`}
			>
				<div className="rounded-lg border border-white/10 bg-white/5 p-4">
					<div className="mb-4">
						<p className="text-white text-3xl font-bold break-words">
							{conversationData.userDetails.firstName}{" "}
							{conversationData.userDetails.lastName}
						</p>
						<p className="text-highlight text-xl">
							{"relationshipToLovedOne" in conversationData.userDetails
								? conversationData.userDetails.relationshipToLovedOne
								: conversationData.userDetails.role || ""}
						</p>
					</div>

					<div className="space-y-3 ml-1">
						<div className="flex items-center">
							<Phone className="text-highlight h-5 w-5 mr-3 flex-shrink-0" />
							<p className="text-white text-xl whitespace-nowrap overflow-hidden text-ellipsis">
								{"phoneNumber" in conversationData.userDetails
									? conversationData.userDetails.phoneNumber
									: "Not provided"}
							</p>
						</div>

						{conversationData.userDetails.role === "Primary User" && (
							<div className="flex items-center">
								<Calendar className="text-highlight h-5 w-5 mr-3 flex-shrink-0" />
								<p className="text-white text-xl">
									{"dateOfBirth" in conversationData.userDetails
										? conversationData.userDetails.dateOfBirth
										: "Not provided"}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Right Half - Loved One Profile (only for caregivers) */}
			{conversationData.userDetails.role === "Caregiver" && (
				<div className="w-1/2 pl-2 flex flex-col">
					<div className="rounded-lg border border-white/10 bg-white/5 p-4">
						<div className="mb-4">
							<p className="text-white text-3xl font-bold break-words">
								{conversationData.userDetails.lovedOne
									? `${conversationData.userDetails.lovedOne.lovedOneFirstName} ${conversationData.userDetails.lovedOne.lovedOneLastName}`
									: `Loved One's Name`}
							</p>
							<p className="text-highlight text-xl">Primary User</p>
						</div>

						<div className="space-y-3 ml-1">
							<div className="flex items-center">
								<Phone className="text-highlight h-5 w-5 mr-3 flex-shrink-0" />
								<p className="text-white text-xl whitespace-nowrap overflow-hidden text-ellipsis">
									{conversationData.userDetails.lovedOne
										?.lovedOneAlertPhoneNumber || "Not provided"}
								</p>
							</div>

							<div className="flex items-center">
								<Calendar className="text-highlight h-5 w-5 mr-3 flex-shrink-0" />
								<p className="text-white text-xl">
									{conversationData.userDetails.lovedOne?.lovedOneDateOfBirth ||
										"Not provided"}
								</p>
							</div>

							<div className="flex items-center">
								<BellRing className="text-highlight h-5 w-5 mr-3 flex-shrink-0" />
								<p className="text-white text-xl">
									{conversationData.userDetails.lovedOne
										?.lovedOneAlertPreferences
										? conversationData.userDetails.lovedOne
												?.lovedOneAlertPreferences
										: "Not provided"}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default StepUserDetails;
