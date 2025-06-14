"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";

interface SidebarRendererProps {
	// These props are included for future use but not currently used
	favorites?: Record<string, unknown>[];
	profile?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SidebarRenderer(props: SidebarRendererProps) {
	return <AppSidebar />;
}
