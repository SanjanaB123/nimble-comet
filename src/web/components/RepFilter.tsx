import type { RepSummary } from "../../shared/types";

interface RepFilterProps {
  reps: RepSummary[];
  value: string;
  onChange: (repId: string) => void;
}

export function RepFilter({ reps, value, onChange }: RepFilterProps) {
  return (
    <label className="filter">
      <span>Rep</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All reps</option>
        {reps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.name}
          </option>
        ))}
      </select>
    </label>
  );
}
