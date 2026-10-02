export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export function fixedClock(time: Date | string): Clock {
  const fixed = new Date(time);
  return { now: () => new Date(fixed) };
}
