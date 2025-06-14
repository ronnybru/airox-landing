"use client";

import * as React from "react";

export function useMediaQuery(
	query: string,
	options: {
		ssr?: boolean;
		fallback?: boolean;
	} = {}
) {
	const { ssr = false, fallback = false } = options;
	const [matches, setMatches] = React.useState<boolean>(() => {
		if (ssr) {
			return fallback;
		}

		if (typeof window !== "undefined") {
			return window.matchMedia(query).matches;
		}

		return fallback;
	});

	React.useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const mql = window.matchMedia(query);
		const onChange = () => {
			setMatches(mql.matches);
		};

		mql.addEventListener("change", onChange);
		setMatches(mql.matches);

		return () => {
			mql.removeEventListener("change", onChange);
		};
	}, [query]);

	return matches;
}
