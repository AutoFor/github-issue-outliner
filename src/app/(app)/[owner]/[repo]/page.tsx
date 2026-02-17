import { isDevMode, getDevToken } from "@/lib/auth-mode";  // Dev モード判定
import { OutlinerRoot } from "@/components/outliner/OutlinerRoot";  // メインアウトライナー

interface Props {
  params: Promise<{ owner: string; repo: string }>;  // URL パラメータ
}

export default async function OutlinerPage({ params }: Props) {
  const { owner, repo } = await params;  // パラメータを取得

  let accessToken: string;

  if (isDevMode()) {
    accessToken = getDevToken();  // Dev モード: 環境変数の PAT
  } else {
    const { auth } = await import("@/auth");  // Prod モード: セッションから取得
    const session = await auth();
    accessToken = session!.accessToken;
  }

  return (
    <OutlinerRoot
      owner={owner}
      repo={repo}
      accessToken={accessToken}
    />
  );
}
