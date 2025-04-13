"use client";

import React from "react";

type Props = {
	isConnected: boolean;
};

const initState: Props = {
	isConnected: false,
};

const AppStateCtx = React.createContext<Props>(initState);
const SetAppStateCtx = React.createContext<
	React.Dispatch<React.SetStateAction<Props>>
>(() => null);

const AppStateProvider: React.FC<{ children?: React.ReactNode }> = ({
	children,
}) => {
	const [state, dispatch] = React.useState<Props>(initState);

	return (
		<SetAppStateCtx.Provider value={dispatch}>
			<AppStateCtx.Provider value={state}>{children}</AppStateCtx.Provider>
		</SetAppStateCtx.Provider>
	);
};

export const useAppState = () => React.useContext(AppStateCtx);
export const useSetAppState = () => React.useContext(SetAppStateCtx);

export default AppStateProvider;
