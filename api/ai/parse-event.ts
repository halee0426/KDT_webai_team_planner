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
import { parseEventDrafts } from "../../src/server/aiFeatureRunner.js";

export const config = { runtime: "nodejs", maxDuration: 60 };

type Body = {
  text?: string;
  scope?: "personal" | "group";
  groupId?: string;
  referenceDate?: string;
  busyTimeHints?: Array<{ date: string; startTime?: string; endTime?: string; title?: string }>;
  holidays?: Array<{ date: string; name: string }>;
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
    if (!body.text || typeof body.text !== "string") {
      return sendBadRequest(res, "text is required");
    }

    const data = await parseEventDrafts({
      uid: user.uid,
      text: body.text,
      scope: body.scope,
      groupId: body.groupId,
      referenceDate: body.referenceDate,
      busyTimeHints: body.busyTimeHints,
      holidays: body.holidays,
    });
    res.status(200).json(data);
  } catch (e) {
    sendServerError(res, e);
  }
}
