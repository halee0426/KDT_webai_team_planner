import { verifyAuthHeader, type VerifiedUser } from "./gateway/auth.js";

export type VReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

export type VRes = {
  status: (n: number) => VRes;
  json: (body: unknown) => VRes;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

export function getHeader(req: VReq, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()] ?? req.headers[name];
  if (Array.isArray(v)) return v[0];
  return v;
}

export function readJsonBody<TBody>(req: VReq): TBody {
  if (req.body && typeof req.body === "object") return req.body as TBody;
  if (typeof req.body === "string") return JSON.parse(req.body) as TBody;
  return {} as TBody;
}

export async function requireUser(req: VReq): Promise<VerifiedUser> {
  return verifyAuthHeader(getHeader(req, "authorization"));
}

export function sendMethodNotAllowed(res: VRes): void {
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}

export function sendBadRequest(res: VRes, message: string): void {
  res.status(400).json({ error: "BAD_REQUEST", message });
}

export function sendUnauthorized(res: VRes, message: string): void {
  res.status(401).json({ error: "UNAUTHORIZED", message });
}

export function sendServerError(res: VRes, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  res.status(500).json({ error: "AI_FEATURE_FAILED", message });
}
