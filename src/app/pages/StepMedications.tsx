import React from "react";
import { useConversationData } from "@/context/ConversationData";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Pill } from "lucide-react";

const formatMedicationName = (name?: string): string => {
	if (!name) return "";
	return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const StepMedications: React.FC = () => {
	const conversationData = useConversationData();

	return (
		<div className="mt-6">
			{conversationData.medications?.medications.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/20 rounded-lg">
					<Pill className="h-16 w-16 text-white/30 mb-4" />
					<p className="text-white/60 text-xl mb-2">No medications added yet</p>
					<p className="text-white/80 text-lg">Say &quot;Add medication&quot; to begin</p>
				</div>
			) : (
				<div className="rounded-lg overflow-hidden">
					<Table className="w-full">
						<TableBody>
							{conversationData.medications?.medications.map((med, i) => (
								<TableRow
									key={i}
									className="border-b border-white/10 hover:bg-white/5"
								>
									<TableCell className="text-white py-4 w-[45%]">
										<div className="text-2xl font-bold">
											{formatMedicationName(med.name)} {med.strength}
										</div>
									</TableCell>
									<TableCell className="w-[55%]">
										{med?.doses?.length ? (
											med.doses.map((dose, j) => (
												<div key={j} className="mb-3 last:mb-0">
													<div className="flex flex-col text-lg">
														<div className="flex items-center gap-2">
															<span className="text-white font-medium">
																{dose.pillCount}{" "}
																{med.form?.toLowerCase() || "dose"}
																{dose.pillCount !== 1 && (med.form ? "s" : "s")}
															</span>
															<span className="text-white/70">•</span>
															<span className="text-white">
																{/* {dose.days.includes("everyday") */}
																{/* ? "Every day" */}
																{dose.days.join(", ")}
															</span>
														</div>
														<div className="text-highlight font-medium mt-1">
															{dose.timeOfDay}
														</div>
													</div>
												</div>
											))
										) : (
											<div className="text-white/50 text-lg">Not scheduled</div>
										)}

										{med.asNeeded ? (
											<div className="mt-2 pl-1 border-l-2 border-yellow-400/50">
												<div className="text-yellow-400 text-lg font-medium">
													{med.asNeeded}x {med.doses?.length ? "more " : ""}
													taken as-needed per day
												</div>
											</div>
										) : null}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default StepMedications;
