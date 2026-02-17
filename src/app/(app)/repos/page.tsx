import { getRepos } from "@/actions/issue-actions";  // リポジトリ取得
import { RepoList } from "@/components/layout/RepoList";  // リポジトリ一覧コンポーネント

export default async function ReposPage() {
  const repos = await getRepos();  // Server Action でリポジトリ取得

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">リポジトリを選択</h1>
      <p className="mb-8 text-muted-foreground">
        Issue をアウトライナーで管理するリポジトリを選んでください
      </p>
      <RepoList repos={repos} />
    </div>
  );
}
