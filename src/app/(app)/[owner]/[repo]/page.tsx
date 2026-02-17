import { auth } from "@/auth";  // セッション取得
import { OutlinerRoot } from "@/components/outliner/OutlinerRoot";  // メインアウトライナー

interface Props {
  params: Promise<{ owner: string; repo: string }>;  // URL パラメータ
}

export default async function OutlinerPage({ params }: Props) {
  const { owner, repo } = await params;  // パラメータを取得
  const session = await auth();  // セッション取得

  return (
    <OutlinerRoot
      owner={owner}
      repo={repo}
      accessToken={session!.accessToken}
    />
  );
}
