import type { DemoAccount } from "../../shared/types";

interface AccountSwitcherProps {
  accounts: DemoAccount[];
  token: string;
  onChange: (token: string) => void;
}

export function AccountSwitcher({ accounts, token, onChange }: AccountSwitcherProps) {
  return (
    <label className="account-switcher">
      <span>Signed in as</span>
      <select value={token} onChange={(event) => onChange(event.target.value)}>
        {accounts.map((account) => (
          <option key={account.token} value={account.token}>
            {account.name} ({account.role === "manager" ? `Manager, ${account.teamName}` : `Rep, ${account.teamName}`})
          </option>
        ))}
      </select>
    </label>
  );
}
