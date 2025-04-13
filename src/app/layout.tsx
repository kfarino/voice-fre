import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AppStateProvider from "@/context/AppState";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Voice FRE",
	description: "Voice First Run Experience",
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
					{children}
				</AppStateProvider>
				<Toaster richColors position="top-right" />
			</body>
		</html>
	);
}
