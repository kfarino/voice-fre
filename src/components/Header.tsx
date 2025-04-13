"use client";

import React, { useEffect, useState } from "react";
import Style from "@/ai/style.module.css";

interface HeaderProps {
    isSpeaking: boolean;
}

const suggestedPrompts = [
    "What's changed recently?",
    "I want to add Potassium Chloride to her dosage.",
    "Is mom stable enough to travel next week?",
    "What insights should I share with Dr. White today?",
    "What would make the biggest difference for her this week?"
];

const Header: React.FC<HeaderProps> = ({ isSpeaking }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isSpeaking) {
            setIsAnimating(true);
        } else {
            // Add a small delay before stopping animation to prevent abrupt stops
            const timeout = setTimeout(() => {
                setIsAnimating(false);
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [isSpeaking]);

    return (
        <div className="w-full bg-black border-b border-[#F26C3A]/20 p-4">
            <div className="flex justify-center mb-8">
                <div className={`${Style.bars} ${isAnimating ? Style.speaking : ""}`}>
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                    <div />
                </div>
            </div>
            
            <div className="max-w-3xl mx-auto">
                <h3 className="text-xl font-semibold mb-4 text-white/90 text-center">Suggestions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                        <div
                            key={index}
                            className="p-3 rounded-lg bg-black border border-[#F26C3A]/20 
                                     text-[#F26C3A] text-sm cursor-pointer 
                                     hover:bg-[#F26C3A]/10 hover:border-[#F26C3A]/30 
                                     transition-all duration-200"
                        >
                            {prompt}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Header; 