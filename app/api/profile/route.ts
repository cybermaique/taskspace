import { NextResponse } from "next/server";

import { parseJson, withAuth } from "@/lib/api/route";
import { updateProfileSchema } from "@/lib/api/schemas";
import { updateProfile } from "@/lib/profiles";

export const PATCH = withAuth("Não foi possível salvar o perfil.", async (request: Request) =>
  NextResponse.json({ profile: await updateProfile(await parseJson(request, updateProfileSchema)) }),
);
