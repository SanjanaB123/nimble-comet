import type { CurrentUserResponse, DemoAccount, RepSummary } from "../../shared/types";
import type { RequestContext } from "../auth/requestContext";
import type { DirectoryRepository, SessionRepository } from "../repository/types";
import { ForbiddenError } from "./errors";

export class DirectoryService {
  constructor(
    private readonly directory: DirectoryRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async currentUser(context: RequestContext): Promise<CurrentUserResponse> {
    const { user, scope } = context;
    const teamIds = scope.kind === "teams" ? scope.teamIds : user.teamId ? [user.teamId] : [];
    const teams = await this.directory.findTeamsByIds(teamIds);

    return {
      user: { id: user.id, name: user.name, role: user.role },
      teams: teams.map((team) => ({ id: team.id, name: team.name })),
    };
  }

  async listTeamReps(context: RequestContext): Promise<RepSummary[]> {
    if (context.scope.kind !== "teams") {
      throw new ForbiddenError("Only managers can list team members");
    }
    const reps = await this.directory.findRepsByTeamIds(context.scope.teamIds);
    return reps
      .map((rep) => ({ id: rep.id, name: rep.name, teamId: rep.teamId! }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Demo sign-in options for local development. */
  async listDemoAccounts(): Promise<DemoAccount[]> {
    const accounts: DemoAccount[] = [];
    for (const session of await this.sessions.listSessions()) {
      const user = await this.directory.findUserById(session.userId);
      if (!user) continue;

      const team =
        user.role === "manager"
          ? (await this.directory.findTeamsManagedBy(user.id))[0]
          : user.teamId
            ? await this.directory.findTeamById(user.teamId)
            : undefined;
      accounts.push({ token: session.token, name: user.name, role: user.role, teamName: team?.name ?? "" });
    }
    return accounts;
  }
}
