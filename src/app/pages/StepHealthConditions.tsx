import React from "react";
import { useConversationData } from "@/context/ConversationData";

const StepHealthConditions: React.FC = () => {
	const conversationData = useConversationData();

	return (
		<div className="p-4 rounded-lg border border-white/10 bg-white/5">
			{conversationData.healthConditions?.conditions.length === 0 ? (
				<p className="text-white/40 text-lg">No health conditions added</p>
			) : (
				<div className="flex flex-wrap gap-4">
					{conversationData.healthConditions?.conditions.map((condition) => (
						<div
							key={condition}
							className="bg-white/10 text-white text-xl inline-flex items-center rounded-xl px-6 py-3 font-medium shadow-md backdrop-blur-sm"
						>
							{condition}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default StepHealthConditions;
