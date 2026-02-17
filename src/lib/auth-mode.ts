/** Dev モード判定: GITHUB_TOKEN が設定されていれば OAuth 不要 */
export function isDevMode(): boolean {
  return !!process.env.GITHUB_TOKEN;  // PAT があれば Dev モード
}

/** Dev モード用のトークンを取得 */
export function getDevToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN が設定されていません");
  return token;
}
