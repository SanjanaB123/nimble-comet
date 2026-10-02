import type { DirectoryRepository, User } from "../repository/types";

/**
 * What the signed-in user is allowed to see. Managers see the teams they
 * manage; reps see only their own work.
 */
export type AccessScope = { kind: "teams"; teamIds: string[] } | { kind: "self"; userId: string };

export interface RequestContext {
  user: User;
  scope: AccessScope;
}

export async function buildRequestContext(user: User, directory: DirectoryRepository): Promise<RequestContext> {
  if (user.role === "manager") {
    const teams = await directory.findTeamsManagedBy(user.id);
    return { user, scope: { kind: "teams", teamIds: teams.map((team) => team.id) } };
  }
  return { user, scope: { kind: "self", userId: user.id } };
}
