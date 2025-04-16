import React from "react";
import { format } from "date-fns";
import { Wifi } from "lucide-react";
import { useAppState } from "@/context/AppState";

const Header: React.FC = () => {
	const appState = useAppState();
	const [currentTime, setCurrentTime] = React.useState<Date>();

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

	React.useEffect(() => {
		const getTime = () => {
			const date = new Date();
			setCurrentTime(date);
		};

		getTime();
		const interval = setInterval(getTime, 10000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="w-full text-white py-4 px-8 flex flex-col relative z-10">
			<div className="flex justify-between items-center">
				<div className="text-[12px] font-medium">
					{currentTime ? format(currentTime, "EEE, MMM d") : ""}
				</div>
				<div className="text-[12px] font-medium absolute left-1/2 transform -translate-x-1/2">
					{currentTime ? format(currentTime, "h:mm a") : ""}
				</div>

				<div>
					<Wifi size={14} />
				</div>
			</div>

			<div className="text-[32px] font-bold flex items-center justify-center">
				{title}
			</div>
		</div>
	);
};

export default Header;
