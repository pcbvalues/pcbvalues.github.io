import type { Score } from "../../src/typescript/types.d.ts"

export { Score };

export type APIActions = "ERROR" | "CONFIRM" | "SUCCESS" | "FAILURE";

export type APIResponse<T> = {
    action: APIActions;
    message: string;
    extra?: T;
};