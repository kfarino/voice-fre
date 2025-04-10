import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Wifi } from "lucide-react";

type Props = {
	title: string;
};

const Header: React.FC<Props> = ({ title }) => {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="w-full text-white py-4 px-8 flex flex-col relative z-10">
			<div className="flex justify-between items-center">
				<div className="text-[25px] font-medium">
					{format(currentTime, "EEE, MMM d")}
				</div>
				<div className="text-[25px] font-medium absolute left-1/2 transform -translate-x-1/2">
					{format(currentTime, "h:mm a")}
				</div>
				<div>
					<Wifi size={28} />
				</div>
			</div>
		</div>
	);
};

export default Header;
