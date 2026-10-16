import { NextResponse } from "next/server";

import { readFile, withAuth } from "@/lib/api/route";
import { uploadAvatar } from "@/lib/profiles";

export const POST = withAuth("Não foi possível salvar a foto.", async (request: Request) =>
  NextResponse.json({ profile: await uploadAvatar(await readFile(request)) }),
);
