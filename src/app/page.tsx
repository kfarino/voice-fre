"use client";

import Ai from "@/ai";
import { useAppState } from "@/context/AppState";
import Header from "./Header";
import Step1 from "./pages/Step1";

export default function Home() {
	const appState = useAppState();

	return (
		<main className="min-h-screen bg-black text-white">
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="min-w-[747px] w-[747px] h-[420px] border-2 border-white/30 overflow-hidden relative">
					<div className="w-full h-full flex flex-col overflow-hidden">
						<Ai />
						<Header title="Welcome" />

						<div className="overflow-auto">
							{appState.step === "userDetails" && <Step1 />}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
