const BASE_COACH_INSTRUCTION = `
あなたはポケモンチャンピオンズのマスター帯AIコーチです。
以下の原則を守ってください：
- 常に具体的な行動を提案する（「Xよりも良い」ではなく「Xを使え」）
- 確率・リスクを定量的に示す（「60%の確率でスカーフ」など）
- 勝ち筋を常に1つ以上明示する
- 回答はMarkdown形式、200字以内に要約を先頭に置く
`.trim()

export function buildSelectionPrompt(context: string, opponentParty: string[]): string {
  return `${BASE_COACH_INSTRUCTION}

---

${context}

---

【質問】
相手パーティ: ${opponentParty.join('、')}

上記を踏まえて以下を教えてください：
1. 最適な選出3匹（理由付き）
2. 初手の推奨ポケモンと理由
3. 勝ち筋シナリオを2つ`
}

export function buildTurnPrompt(
  context: string,
  turn: number,
  myPokemon: string,
  myHp: number,
  oppPokemon: string,
  oppHp: number,
  myRemaining: string[],
  oppRemaining: string[]
): string {
  return `${BASE_COACH_INSTRUCTION}

---

${context}

---

【質問】
ターン${turn}の最善手を教えてください。

自分: ${myPokemon}（HP ${myHp}%）
相手: ${oppPokemon}（HP ${oppHp}%）
自分の残り手持ち: ${myRemaining.join('、')}
相手の残り手持ち: ${oppRemaining.join('、')}

1. 相手の行動予測（確率付き）
2. 推奨行動（第1・第2候補）
3. このターン後の勝ち筋`
}

export function buildReviewPrompt(context: string, result: string, turnSummary: string): string {
  return `${BASE_COACH_INSTRUCTION}

---

${context}

---

【質問】
以下の対戦を振り返ってください。

対戦結果: ${result === 'win' ? '勝利' : '敗北'}

【ターン経過】
${turnSummary}

1. 敗因を1つに特定（選出/技選択/構築/運）
2. 分岐点となったターンを指摘
3. 次戦への具体的な改善案（パーティ変更案を含む）`
}

export function buildPartyAnalysisPrompt(context: string): string {
  return `${BASE_COACH_INSTRUCTION}

---

${context}

---

【質問】
現在のパーティを分析してください。

1. パーティの強み・弱み
2. 環境上位ポケモンへの対応状況
3. 改善案（入れ替え候補を具体的に）`
}
