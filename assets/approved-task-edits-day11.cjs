// Approved Day 11 groups: A+B and C+D+E. Keep all surviving exchanges and
// variations intact; remove only the original F (missing-item) practice.
const clone = value => JSON.parse(JSON.stringify(value));

function chapter(task, id, name, order, description, position) {
  task.chapter = { id, name, order, description, position };
}

module.exports = function applyApprovedDay11(day, tasks) {
  if (Number(day) !== 11) return tasks;
  const result = clone(tasks).filter(task => task.key !== 'missing-item');
  const ids = {
    'introduce-origin': 'A',
    'travel-companion': 'B',
    'ask-share-interest': 'C',
    'respond-interest': 'D',
    'share-visit': 'E'
  };
  const byKey = new Map(result.map(task => [task.key, task]));
  for (const key of Object.keys(ids)) if (!byKey.has(key)) throw Error('Missing original Day 11 task: ' + key);

  const introductionDescription = '分 A、B 兩輪認識旅伴：先介紹來處並打招呼，再介紹同行者、把同一個問題問回去。每輪只練 2 句，先練熟並完成自己的回顧，再進下一輪。';
  const conversationDescription = '分 C、D、E 三輪：C 主動問興趣，再分享自己的興趣；D 換成旅伴主動分享時練一句回應；E 換到參觀結束後，分享遊玩感想與人潮感受。每輪有自己的起點，只練 1～2 句，各變化先看示範再分次練。';

  for (const task of result) {
    if (ids[task.key]) task.id = ids[task.key];
    switch (task.key) {
      case 'introduce-origin':
        task.changeNote = '與介紹同行者合成認識旅伴一章；本輪仍只練來處與打招呼，臺灣、臺北的全部原句與變化保留，練熟再接 B 的同行者話題。';
        chapter(task, 'day11-meet-companions', '認識旅伴：來處與同行者', 1, introductionDescription, 0);
        break;
      case 'travel-companion':
        task.context = '你已和新旅伴打過招呼，現在聊和誰同行。你和家人一起旅行，先回答自己的同行者，再把同一個問題問回去；對方和朋友同行。';
        task.changeNote = '與介紹來處、打招呼合章，仍維持獨立兩句小輪：說明同行者，再把同一個問題問回去。家人與朋友同行的全部原句和變化保留。';
        chapter(task, 'day11-meet-companions', '認識旅伴：來處與同行者', 1, introductionDescription, 1);
        break;
      case 'ask-share-interest':
        task.changeNote = '與回應興趣、分享參觀感想合章，仍保留自己的兩句小輪；先問旅伴興趣，聽懂健行後再分享拍照。自己改成喜歡閱讀的原變化完整保留，練熟再換下一個起點。';
        chapter(task, 'day11-interests-and-visits', '聊興趣與分享遊玩感想', 2, conversationDescription, 0);
        break;
      case 'respond-interest':
        task.context = '這一輪換成旅伴主動分享的獨立聊天起點。他告訴你自己喜歡健行，你覺得聽起來很有趣，練習用一句話回應；不用重問 C 的興趣問題，也不用再介紹自己的興趣。';
        task.changeNote = '與問興趣、分享參觀感想合章；中文說明本輪從旅伴主動分享開始，只練原本的回應句。旅伴喜歡健行或閱讀的全部原聽力與變化保留。';
        chapter(task, 'day11-interests-and-visits', '聊興趣與分享遊玩感想', 2, conversationDescription, 1);
        break;
      case 'share-visit':
        task.context = '這一輪把時間移到參觀結束後：你和旅伴都剛逛完博物館。你覺得很棒，也覺得現場人很多；先回答參觀感想，再回應旅伴對人潮的描述。';
        task.changeNote = '與興趣聊天合章，明確切到參觀結束後的情境；本輪只練感想與同意人多的兩句，博物館、公園的全部原問答與變化保留。';
        chapter(task, 'day11-interests-and-visits', '聊興趣與分享遊玩感想', 2, conversationDescription, 2);
        break;
    }
  }
  return result;
};
