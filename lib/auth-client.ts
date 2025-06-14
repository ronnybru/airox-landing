import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth"; // Import as type

export const authClient = createAuthClient({
	// The base URL is optional if you're using the same domain
	// baseURL: "http://localhost:3000"
	plugins: [
		organizationClient(),
		// Add custom session client to include activeOrganization in session
		customSessionClient<typeof auth>(),
	],
});

// Export specific methods for easier imports
export const {
	signIn,
	signUp,
	signOut,
	useSession,
	getSession,
	// Organization-specific exports
	useListOrganizations,
	useActiveOrganization,
} = authClient;

// Export organization namespace for direct access to organization methods
export const { organization } = authClient;
