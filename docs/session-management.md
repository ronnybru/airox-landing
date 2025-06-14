# Session Management Guide

This guide explains how to access authentication sessions & data in both server and client components. We use better auth library for authentication with organization support.

## Server Components & Server Actions

Use the helpers in `lib/session.ts` to access the session in server components and server actions:

```typescript
import {
	getServerSession,
	requireServerSession,
	getCurrentUserId,
} from "@/lib/session";

// Get the session (returns null if not authenticated)
const session = await getServerSession();

// Get the session and throw error if not authenticated
const session = await requireServerSession();

// Get just the user ID
const userId = await getCurrentUserId();
```

### Example in Server Component

```typescript
import { getServerSession } from "@/lib/session";

export default async function DashboardPage() {
	const session = await getServerSession();

	if (!session) {
		return <div>Please sign in</div>;
	}

	return <div>Welcome, {session.user.email}</div>;
}
```

### Example in Server Action

```typescript
"use server";

import { getServerSession } from "@/lib/session";

export async function fetchUserData() {
	const session = await getServerSession();

	if (!session) {
		return { success: false, error: "Not authenticated" };
	}

	// Use session.user.id to fetch user-specific data
	return {
		success: true,
		data: {
			/* user data */
		},
	};
}
```

## Client Components

Use the hooks and functions from `lib/auth-client.ts` to access the session in client components:

```typescript
import { useSession, getSession } from "@/lib/auth-client";

// Hook for reactive components
function ProfileButton() {
	const { data: session, isPending } = useSession();

	if (isPending) return <div>Loading...</div>;
	if (!session) return <div>Sign in</div>;

	return <div>Hello, {session.user.email}</div>;
}

// Direct function for async operations
async function fetchClientData() {
	const { data: session } = await getSession();

	if (!session) {
		console.log("Not authenticated");
		return;
	}

	console.log(`User ID: ${session.user.id}`);
}
```

## Customizing Session Data

You can add custom fields to the session response by using the `customSession` plugin in `lib/auth.ts`:

```typescript
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
	// ... other config
	plugins: [
		// ... other plugins
		customSession(async ({ user, session }) => {
			// Fetch additional data
			const roles = await fetchUserRoles(user.id);
			const preferences = await fetchUserPreferences(user.id);

			return {
				// Add custom fields
				roles,
				preferences,
				// Include original user and session
				user,
				session,
			};
		}),
	],
});
```

Then update client-side type inference in `lib/auth-client.ts`:

```typescript
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "./auth"; // Import as type

export const authClient = createAuthClient({
	plugins: [customSessionClient<typeof auth>()],
});

// Now session will include your custom fields
const { data: session } = useSession();
// session.user.role
// session.user.activeOrganization
```

This approach allows you to extend the session with additional data that will be available in both server and client components.

## Organization Management

Every user in the system has an organization. When a user signs up, a personal workspace is automatically created for them unless they have pending invitations to other organizations.

### Accessing Active Organization from Session

With our customSession implementation, you can access the active organization directly from the session:

#### In Server Components

```typescript
import { getServerSession } from "@/lib/session";

export default async function OrganizationHeader() {
  const session = await getServerSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  // Access active organization directly from the session
  const activeOrg = session.user.activeOrganization;

  if (!activeOrg) {
    return <div>No active organization</div>;
  }

  return <h1>{activeOrg.name}</h1>;
}
```

#### In Client Components

```typescript
import { useSession } from "@/lib/auth-client";

function OrganizationHeader() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;

  // Access active organization directly from the session
  const activeOrg = session.user.activeOrganization;

  if (!activeOrg) {
    return <div>No active organization</div>;
  }

  return <h1>{activeOrg.name}</h1>;
}
```

This approach is more efficient than using the dedicated organization hooks when you just need basic information about the active organization, as it avoids additional API calls.

### Server-side Organization Access

Use these helpers from `lib/session.ts` to access organization data in server components and server actions:

```typescript
import {
	getActiveOrganization,
	getUserOrganizations,
	setActiveOrganization,
} from "@/lib/session";

// Get the user's active organization with members
const activeOrg = await getActiveOrganization();

// Get all organizations the user is a member of
const userOrgs = await getUserOrganizations();

// Set a different organization as active
await setActiveOrganization(organizationId);
```

### Client-side Organization Access

Use these hooks from `lib/auth-client.ts` to access organization data in client components:

```typescript
import {
  useActiveOrganization,
  useListOrganizations,
  organization
} from "@/lib/auth-client";

// Hook for getting the active organization
function OrganizationHeader() {
  const { data: activeOrg, isPending } = useActiveOrganization();

  if (isPending) return <div>Loading...</div>;
  if (!activeOrg) return <div>No active organization</div>;

  return <h1>{activeOrg.name}</h1>;
}

// Hook for listing all user's organizations
function OrganizationSwitcher() {
  const { data: organizations } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();

  // Switch to a different organization
  const switchOrg = async (orgId) => {
    await organization.setActive({ organizationId: orgId });
    window.location.reload(); // Refresh to update UI
  };

  return (
    <div>
      {organizations?.map(org => (
        <button
          key={org.id}
          onClick={() => switchOrg(org.id)}
          disabled={org.id === activeOrg?.id}
        >
          {org.name}
        </button>
      ))}
    </div>
  );
}
```

### Including Organization and Membership in Session

For better performance, you can include the active organization, its credits, and membership details in the session by updating the `customSession` plugin:

```typescript
customSession(async ({ user, session }) => {
  // Get user data
  const userData = await db.query.user.findFirst({
    where: eq(authSchema.user.id, user.id),
  });

  // Get active organization for the user
  const sessionRecord = await db.query.session.findFirst({
    where: eq(authSchema.session.userId, user.id),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  let activeOrganization = null;
  let organizationCredits = 0;
  let organizationMembership = null;

  if (sessionRecord?.activeOrganizationId) {
    // Get the active organization with credits
    activeOrganization = await db.query.organization.findFirst({
      where: eq(
        authSchema.organization.id,
        sessionRecord.activeOrganizationId
      ),
      columns: {
        id: true,
        name: true,
        slug: true,
        credits: true,
      },
    });

    if (activeOrganization) {
      organizationCredits = activeOrganization.credits;

      // Get the organization's membership
      const membership = await db.query.organizationMemberships.findFirst({
        where: eq(
          authSchema.organizationMemberships.organizationId,
          activeOrganization.id
        ),
      });

      if (membership) {
        organizationMembership = {
          id: membership.id,
          membershipId: membership.membershipId,
          status: membership.status,
          startDate: membership.startDate,
          endDate: membership.endDate,
        };
      }
    }
  }

  return {
    user: {
      ...user,
      role: userData?.role || "user",
      activeOrganization,
      organizationCredits,
      organizationMembership,
    },
    session,
  };
}),
```

This approach reduces the need for additional database queries when accessing the active organization, its credits, and membership details in components. You can access these values directly from the session:

```typescript
// In server components
const session = await getServerSession();
const credits = session?.user.organizationCredits || 0;
const membership = session?.user.organizationMembership;

// In client components
const { data: session } = useSession();
const credits = session?.user.organizationCredits || 0;
const membership = session?.user.organizationMembership;
```
