import {
  readJsonBody,
  requireUser,
  sendBadRequest,
  sendMethodNotAllowed,
  sendServerError,
  sendUnauthorized,
  type VReq,
  type VRes,
} from "../../src/server/apiHttp.js";
import { generateMandalaDraft } from "../../src/server/aiFeatureRunner.js";

export const config = { runtime: "nodejs", maxDuration: 60 };

type Body = {
  centerGoal?: string;
  scope?: "personal" | "group";
  groupId?: string;
  existingActiveGoals?: Array<{ centerGoal: string }>;
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
    if (!body.centerGoal || typeof body.centerGoal !== "string") {
      return sendBadRequest(res, "centerGoal is required");
    }

    const data = await generateMandalaDraft({
      uid: user.uid,
      centerGoal: body.centerGoal,
      scope: body.scope,
      groupId: body.groupId,
      existingActiveGoals: body.existingActiveGoals,
    });
    res.status(200).json(data);
  } catch (e) {
    sendServerError(res, e);
  }
}
