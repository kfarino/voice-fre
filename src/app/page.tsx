"use client";

import Ai from "@/ai";
import HealthDashboard from "@/components/HealthDashboard";
import { useConversation } from "@11labs/react";

export default function Home() {
	const conversation = useConversation();

	return (
		<main className={`${conversation.status === 'connected' ? 'min-h-screen' : 'h-screen'} bg-black text-white overflow-hidden`}>
			<div className={`${conversation.status === 'connected' ? 'min-h-screen' : 'h-screen'} flex flex-col`}>
				<div className="w-full flex justify-center pt-8 pb-4">
					<img src="/images/logo.png" alt="Logo" className="h-16 w-auto ml-4" />
				</div>
				<div className="flex-1 relative">
					{conversation.status === 'connected' ? (
						<>
							<HealthDashboard />
							<Ai />
						</>
					) : (
						<Ai />
					)}
				</div>
			</div>
		</main>
	);
}
