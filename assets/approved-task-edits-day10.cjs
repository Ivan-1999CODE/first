// Approved Day 10 scope: A+B+C and E+F. Keep their original task labels,
// speaking/listening exchanges and variations; remove only D/G/H/I/J/K.
const clone = value => JSON.parse(JSON.stringify(value));

function chapter(task, id, name, order, description, position) {
  task.chapter = { id, name, order, description, position };
}

module.exports = function applyApprovedDay10(day, tasks) {
  if (Number(day) !== 10) return tasks;
  const removed = new Set(['accept-decline-drinks', 'apologize-check', 'apologize-wait', 'offer-help', 'respond-apology', 'accept-help']);
  const result = clone(tasks).filter(task => !removed.has(task.key));
  const ids = {
    'attention-napkins': 'A',
    'request-water': 'B',
    'ask-bag-help': 'C',
    'decline-invitation-reason': 'E',
    'suggest-other-time': 'F'
  };
  const byKey = new Map(result.map(task => [task.key, task]));
  for (const key of Object.keys(ids)) if (!byKey.has(key)) throw Error('Missing original Day 10 task: ' + key);

  const requestsDescription = '分 A、B、C 三輪練禮貌需求：A 在咖啡廳引起店員注意並要餐巾紙，B 向桌邊店員要水；C 換到旅伴在旁的獨立場景，請旅伴幫忙搬行李。每輪只練 1～2 句，練熟再換情境。';
  const invitationDescription = '主情境分兩輪接續：E 婉拒今晚邀請並說明已有安排，F 再提議改明天。各輪變化另外練；E 的「明晚也有安排」不接 F 的「改明天」，F 從今晚不能、明天可約的主情境開始。';

  for (const task of result) {
    if (ids[task.key]) task.id = ids[task.key];
    switch (task.key) {
      case 'attention-napkins':
        task.changeNote = '與請求飲水、請旅伴搬行李合成禮貌提出需求一章；本輪仍先引起店員注意，再要餐巾紙，只練兩句。兩張、三張餐巾紙的全部原問答保留。';
        chapter(task, 'day10-polite-requests', '禮貌提出需求', 1, requestsDescription, 0);
        break;
      case 'request-water':
        task.changeNote = '與引起注意、請求餐巾紙及搬行李合章，仍是獨立飲水小輪；店員已在桌邊，只練需求這一句。水與茶的全部原問答保留，先看變化示範再練。';
        chapter(task, 'day10-polite-requests', '禮貌提出需求', 1, requestsDescription, 1);
        break;
      case 'ask-bag-help':
        task.context = '這一輪換到旅伴在旁的獨立場景。你的袋子有點重，旅伴已看到你需要搬它；你想禮貌地請旅伴幫忙，這次接話的對象是旅伴。';
        task.changeNote = '與餐巾紙、飲水需求合章，並清楚標出換成旅伴幫忙的獨立場景；只練原本的搬行李請求，袋子與行李箱的全部原問答保留。';
        chapter(task, 'day10-polite-requests', '禮貌提出需求', 1, requestsDescription, 2);
        break;
      case 'decline-invitation-reason':
        task.context = '主情境：旅伴邀你今晚一起吃飯，但你已有安排。你先婉拒邀請；對方接著確認你是不是有事，你簡短說明已有安排。本輪的明晚邀請變化另外練；下一輪提議時間時，回到今晚不能參加的主情境。';
        task.changeNote = '與提出另一個時間合章，仍分兩輪：本輪只練婉拒與原因，全部原句保留。明晚已有安排的原變化獨立練，避免接到下一輪主情境的改明天。';
        chapter(task, 'day10-decline-and-reschedule', '婉拒邀請並提其他時間', 2, invitationDescription, 0);
        break;
      case 'suggest-other-time':
        task.context = '這一輪從今晚不能參加、明天可以再約的主情境開始：你已禮貌婉拒今晚吃飯，旅伴知道你今晚有事。你仍想一起吃飯，現在主動提議改明天；E 的明晚也有安排是另一個練習情境。';
        task.changeNote = '與婉拒邀請、說明原因合章；接續今晚已有安排的主情境，只練原本的提議時間一句。改明天、改星期日的全部原問答保留，各變化分開練。';
        chapter(task, 'day10-decline-and-reschedule', '婉拒邀請並提其他時間', 2, invitationDescription, 1);
        break;
    }
  }
  return result;
};
