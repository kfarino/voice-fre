import React from "react";
import { useAppState } from "@/context/AppState";

const Header: React.FC = () => {
	const appState = useAppState();

	const title = React.useMemo(() => {
		switch (appState.step) {
			case "userDetails":
				return "User Details";
			case "healthConditions":
				return "Health Conditions";
			case "medications":
				return "Medications";
			default:
				return "";
		}
	}, [appState.step]);

	return (
		<div className="w-full text-white py-4 px-8 flex flex-col relative z-10">
			<div className="text-[32px] font-bold flex items-center justify-center">
				{title}
			</div>
		</div>
	);
};

export default Header;
