import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
// import "./index.css";
import { Toaster } from "sonner";
import ConversationDataProvider from "@/context/ConversationData";
import AppStateProvider from "@/context/AppState";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "User Information Collection",
	description: "Collect user information through conversation",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<AppStateProvider>
					<ConversationDataProvider>{children}</ConversationDataProvider>
				</AppStateProvider>
				<Toaster richColors position="top-right" />
			</body>
		</html>
	);
}
