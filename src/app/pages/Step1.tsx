import React, { useState } from "react";
import { User, Calendar, BellRing, Phone } from "lucide-react";
import { useConversationData } from "@/context/ConversationData";

const Step1: React.FC = () => {
	const conversationData = useConversationData();

	return (
		<div className="animate-fade-in flex flex-col h-full px-10 py-6">
			<div className="space-y-6">
				<div className="grid grid-cols-2 gap-5 mb-4">
					{(conversationData.userDetails?.firstName ||
						conversationData.userDetails?.lastName) && (
						<div className="voice-display-card p-3">
							<User className="text-highlight h-6 w-6" />
							<div className="flex-1">
								<p className="text-white/70 mb-1">Full Name</p>
								<p className="text-xl text-white">
									{`${conversationData.userDetails?.firstName} ${conversationData.userDetails?.lastName}`}
								</p>
							</div>
						</div>
					)}

					{conversationData.userDetails?.phoneNumber && (
						<div className="voice-display-card p-3">
							<Phone className="text-highlight h-6 w-6" />
							<div className="flex-1">
								<p className="text-white/70 mb-1">Phone Number</p>
								<p className="text-xl text-white">
									{conversationData.userDetails?.phoneNumber}
								</p>
							</div>
						</div>
					)}

					{conversationData.userDetails?.role && (
						<div className="voice-display-card p-3">
							<BellRing className="text-highlight h-6 w-6" />
							<div className="flex-1">
								<p className="text-white/70 mb-1">Role</p>
								<p className="text-xl text-white">
									{conversationData.userDetails?.role}
								</p>
							</div>
						</div>
					)}

					{conversationData.userDetails &&
						"dateOfBirth" in conversationData.userDetails && (
							<div className="voice-display-card p-3">
								<Calendar className="text-highlight h-6 w-6" />
								<div className="flex-1">
									<p className="text-white/70 mb-1">Date of Birth</p>
									<p className="text-xl text-white">
										{conversationData.userDetails.dateOfBirth}
									</p>
								</div>
							</div>
						)}

					{conversationData.userDetails &&
						"relationshipToLovedOne" in conversationData.userDetails && (
							<div className="voice-display-card p-3">
								<User className="text-highlight h-6 w-6" />
								<div className="flex-1">
									<p className="text-white/70 mb-1">Relationship</p>
									<p className="text-xl text-white">
										{conversationData.userDetails.relationshipToLovedOne}
									</p>
								</div>
							</div>
						)}

					{conversationData.userDetails &&
						"lovedOne" in conversationData.userDetails && (
							<div className="voice-display-card p-3">
								<User className="text-highlight h-6 w-6" />
								<div className="flex-1">
									<p className="text-white/70 mb-1">Loved One Name</p>
									<p className="text-xl text-white">
										{conversationData.userDetails.lovedOne?.lovedOneFirstName}{" "}
										{conversationData.userDetails.lovedOne?.lovedOneLastName}
									</p>
								</div>
							</div>
						)}

					{conversationData.userDetails &&
						"lovedOne" in conversationData.userDetails && (
							<div className="voice-display-card p-3">
								<BellRing className="text-highlight h-6 w-6" />
								<div className="flex-1">
									<p className="text-white/70 mb-1">Alert Preferences</p>
									<p className="text-xl text-white">
										{
											conversationData.userDetails.lovedOne
												?.lovedOneAlertPreferences
										}
									</p>
								</div>
							</div>
						)}

					{conversationData.userDetails &&
						"lovedOne" in conversationData.userDetails && (
							<div className="voice-display-card p-3">
								<Phone className="text-highlight h-6 w-6" />
								<div className="flex-1">
									<p className="text-white/70 mb-1">Alert Phone Number</p>
									<p className="text-xl text-white">
										{
											conversationData.userDetails.lovedOne
												?.lovedOneAlertPhoneNumber
										}
									</p>
								</div>
							</div>
						)}

					{conversationData.userDetails &&
						"lovedOne" in conversationData.userDetails && (
							<div className="voice-display-card p-3">
								<Calendar className="text-highlight h-6 w-6" />
								<div className="flex-1">
									<p className="text-white/70 mb-1">Loved One Date of Birth</p>
									<p className="text-xl text-white">
										{conversationData.userDetails.lovedOne?.lovedOneDateOfBirth}
									</p>
								</div>
							</div>
						)}
				</div>
			</div>
		</div>
	);
};

export default Step1;
