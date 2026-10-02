import { builtInTaskQueries } from "./definitions";
import type { TaskQueryDefinition, TaskQueryName } from "./types";

export class TaskQueryRegistry {
  private readonly definitions = new Map<TaskQueryName, TaskQueryDefinition>();

  register(definition: TaskQueryDefinition): this {
    if (this.definitions.has(definition.name)) {
      throw new Error(`Task query "${definition.name}" is already registered`);
    }
    this.definitions.set(definition.name, definition);
    return this;
  }

  get(name: TaskQueryName): TaskQueryDefinition {
    const definition = this.definitions.get(name);
    if (!definition) {
      throw new Error(`Task query "${name}" is not registered`);
    }
    return definition;
  }

  names(): TaskQueryName[] {
    return [...this.definitions.keys()];
  }
}

export function createTaskQueryRegistry(definitions: readonly TaskQueryDefinition[] = builtInTaskQueries): TaskQueryRegistry {
  const registry = new TaskQueryRegistry();
  for (const definition of definitions) {
    registry.register(definition);
  }
  return registry;
}
