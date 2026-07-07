export type ActionResult<T = undefined> =
  | { status: "success"; data: T }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<string, string[]>> };
