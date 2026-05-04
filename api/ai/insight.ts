import {
  readJsonBody,
  requireUser,
  sendMethodNotAllowed,
  sendServerError,
  sendUnauthorized,
  type VReq,
  type VRes,
} from "../../src/server/apiHttp.js";
import { generateInsight } from "../../src/server/aiFeatureRunner.js";

export const config = { runtime: "nodejs", maxDuration: 60 };

type Body = {
  scope?: "personal" | "group";
  groupId?: string;
  referenceDate?: string;
  context?: unknown;
};

export default async function handler(req: VReq, res: VRes): Promise<void> {
  if (req.method !== "POST") return sendMethodNotAllowed(res);

  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    return sendUnauthorized(res, e instanceof Error ? e.message : String(e));
  }

  try {
    const body = readJsonBody<Body>(req);
    const data = await generateInsight({
      uid: user.uid,
      scope: body.scope,
      groupId: body.groupId,
      referenceDate: body.referenceDate,
      context: body.context,
    });
    res.status(200).json(data);
  } catch (e) {
    sendServerError(res, e);
  }
}
