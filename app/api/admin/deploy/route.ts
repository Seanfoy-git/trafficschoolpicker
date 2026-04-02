export async function POST() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;
  if (!hookUrl) {
    return Response.json(
      { error: "Deploy hook not configured" },
      { status: 500 }
    );
  }
  try {
    await fetch(hookUrl, { method: "POST" });
    return Response.json({ success: true, message: "Deploy triggered" });
  } catch {
    return Response.json({ error: "Deploy failed" }, { status: 500 });
  }
}
