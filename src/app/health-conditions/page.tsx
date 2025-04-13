"use client";

import React from 'react';
import HealthDashboard from '@/components/HealthDashboard';
import { useConnectionStore } from '@/stores/connectionStore';

export default function HealthConditionsPage() {
    const { isConnected } = useConnectionStore();

    if (!isConnected) {
        return (
            <main className="min-h-screen bg-black">
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-white/90 mb-8">Health Conditions Dashboard</h1>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-white/60">Please connect your device first</div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white/90 mb-8">Health Conditions Dashboard</h1>
                <HealthDashboard />
            </div>
        </main>
    );
} 