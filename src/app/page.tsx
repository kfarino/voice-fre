"use client";

import Ai from "@/ai";
import { useAppState } from "@/context/AppState";
import Header from "./Header";
import StepUserDetails from "./pages/StepUserDetails";
import StepHealthConditions from "./pages/StepHealthConditions";
import StepMedications from "./pages/StepMedications";
import { useConversationData } from "@/context/ConversationData";

export default function Home() {
	const appState = useAppState();
	const conversationData = useConversationData();

	return (
		<main className="min-h-screen bg-black text-white">
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="min-w-[747px] w-[747px] h-[420px] border-2 border-white/30 overflow-hidden relative">
					<div className="w-full h-full flex flex-col overflow-hidden">
						<Header />

						{!conversationData.mockData && <Ai />}

						<div className="overflow-auto">
							<div className="animate-fade-in px-6 py-4 pb-8">
								{conversationData.mockData ? (
									<>
										<StepUserDetails />
										<StepHealthConditions />
										<StepMedications />
									</>
								) : (
									<>
										{appState.step === "userDetails" && <StepUserDetails />}
										{appState.step === "healthConditions" && (
											<StepHealthConditions />
										)}
										{appState.step === "medications" && <StepMedications />}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
