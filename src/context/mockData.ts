import { ConversationData } from "./ConversationData";

// Mock data for ConversationData
const mockData: ConversationData = {
	mockData: true,

	// Primary User Example
	userDetails: {
		firstName: "John",
		lastName: "Smith",
		phoneNumber: "555-123-4567",
		role: "Primary User",
		stepCompleted: true,
		dateOfBirth: "January 11, 1990",
	},

	// Caregiver Example
	// userDetails: {
	// 	firstName: "Sarah",
	// 	lastName: "Johnson",
	// 	phoneNumber: "555-987-6543",
	// 	role: "Caregiver",
	// 	stepCompleted: true,
	// 	relationshipToLovedOne: "Daughter",
	// 	lovedOne: {
	// 		lovedOneFirstName: "Martha",
	// 		lovedOneLastName: "Johnson",
	// 		lovedOneDateOfBirth: "March 15, 1945",
	// 		lovedOneAlertPreferences: "SMS",
	// 		lovedOneAlertPhoneNumber: "555-555-5555",
	// 	},
	// },

	healthConditions: {
		conditions: [
			"Diabetes Type 2",
			"Hypertension",
			"High Cholesterol",
			"Alzheimer's",
			"Osteoarthritis",
			"Anxiety",
		],
		stepCompleted: true,
	},
	medications: {
		medications: [
			{
				name: "Metformin",
				strength: "500mg",
				form: "Tablet",
				doses: [
					{
						days: ["M", "T", "W", "Th", "F", "S", "Su"],
						timeOfDay: "8:00AM",
						pillCount: 1,
					},
					{
						days: ["M", "W", "F"],
						timeOfDay: "8:00PM",
						pillCount: 2,
					},
				],
			},
			{
				name: "Lisinopril",
				strength: "10mg",
				form: "Tablet",
				doses: [
					{
						days: ["M", "T", "W", "Th", "F", "S", "Su"],
						timeOfDay: "9:00AM",
						pillCount: 1,
					},
				],
			},
			{
				name: "Ibuprofen",
				strength: "200mg",
				form: "Tablet",
				asNeeded: 3,
			},
			{
				name: "Donepezil",
				strength: "10mg",
				form: "Tablet",
				doses: [
					{
						days: ["M", "T", "W", "Th", "F", "S", "Su"],
						timeOfDay: "9:00PM",
						pillCount: 1,
					},
				],
			},
			{
				name: "Aspirin",
				strength: "81mg",
				form: "Tablet",
				doses: [
					{
						days: ["M", "T", "W", "Th", "F", "S", "Su"],
						timeOfDay: "8:00AM",
						pillCount: 1,
					},
				],
			},
		],
		stepCompleted: true,
	},
};

export default mockData;
