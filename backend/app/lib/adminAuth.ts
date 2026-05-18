export function isAdminAuthorized(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("x-admin-key")?.trim();
  return header === secret;
}

export function adminUnauthorizedResponse(req: Request) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return Response.json(
      {
        error: "Unauthorized",
        reason: "missing_admin_secret",
        message:
          "이 서버 배포에 ADMIN_SECRET이 없어요. Vercel → Settings → Environment Variables → Production에 추가한 뒤 Redeploy 하세요."
      },
      { status: 401 }
    );
  }
  if (!req.headers.get("x-admin-key")?.trim()) {
    return Response.json(
      {
        error: "Unauthorized",
        reason: "missing_header",
        message: "관리자 비밀번호를 입력한 뒤 불러오기를 눌러 주세요."
      },
      { status: 401 }
    );
  }
  return Response.json(
    {
      error: "Unauthorized",
      reason: "wrong_password",
      message:
        "비밀번호가 서버의 ADMIN_SECRET과 다릅니다. Vercel Production에 넣은 값과 화면 입력이 완전히 같은지 확인하세요. (로컬 .env만 넣으면 배포 서버에는 적용되지 않습니다.)"
    },
    { status: 401 }
  );
}
