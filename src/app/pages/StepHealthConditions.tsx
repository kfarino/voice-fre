import React from "react";
import { Heart, Activity, Brain } from "lucide-react";
import { useConversationData } from "@/context/ConversationData";

const StepHealthConditions: React.FC = () => {
	const conversationData = useConversationData();

	return (
		<div className="p-4 rounded-lg border border-white/10 bg-white/5">
			<h3 className="text-xl font-medium text-white/90 mb-3 flex items-center">
				<Heart className="h-5 w-5 mr-2 text-highlight" />
				Health Conditions
			</h3>

			{conversationData.healthConditions?.conditions.length === 0 ? (
				<p className="text-white/40 text-lg">No health conditions added</p>
			) : (
				<div className="flex flex-wrap gap-2">
					{conversationData.healthConditions?.conditions.map((condition) => (
						<div
							key={condition}
							className="bg-white/10 hover:bg-white/20 text-white text-base inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold transition-colorsbg-primary text-primary-foreground"
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
