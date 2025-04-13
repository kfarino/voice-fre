"use client";

import Ai from "@/ai";
import HealthDashboard from "@/components/HealthDashboard";
import { useConversation } from "@11labs/react";

export default function Home() {
	const conversation = useConversation();
	const isConnected = conversation.status === 'connected';

	return (
		<main className="min-h-screen bg-[#000000] text-white">
			<div className="w-full flex justify-center pt-8 pb-4">
				<img src="/images/logo.png" alt="Logo" className="h-16 w-auto ml-4" />
			</div>
			<div className="h-[calc(100vh-120px)]">
				{isConnected ? (
					<>
						<HealthDashboard />
						<Ai />
					</>
				) : (
					<Ai />
				)}
			</div>
		</main>
	);
}
