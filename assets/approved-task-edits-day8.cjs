// Approved Day 8 chapter groups and additional room-supply practice.
// Keep the original array order and task keys so saved round records stay aligned.
const clone = value => JSON.parse(JSON.stringify(value));
const objects = (...labels) => labels.map(label => ['▣', label]);

function chapter(task, id, name, order, description, position = 0) {
  task.chapter = { id, name, order, description, position };
}

function supplyRound(towels, kind) {
  const water = kind === 'water';
  const name = water ? '水' : '棉被';
  const item = water ? 'some water' : 'an extra blanket';
  const confirmation = water ? 'Some water' : 'An extra blanket';
  const itemZh = water ? '一些水' : '一條額外的棉被';
  const room = clone(towels.steps[0]);
  const request = {
    ...clone(towels.steps[1]),
    id: kind,
    label: water ? '要一些水' : '要額外棉被',
    answer: `Could I have ${item}, please?`,
    answerZh: water ? '可以給我一些水嗎？' : '可以再給我一條棉被嗎？',
    line: `${confirmation} for room three oh five.`,
    zh: `305 號房送${itemZh}。`,
    task: `請飯店送${itemZh}到 305 號房。`,
    words: water ? 'could I have / some water / please' : 'could I have / extra blanket / please',
    objects: objects(`305 號房：${itemZh}`, `512 號房：${itemZh}`),
    valid: [0],
    askFirst: true
  };
  const variationSteps = clone([room, request]);
  Object.assign(variationSteps[0], {
    answer: 'This is room five one two.',
    answerZh: '這裡是 512 號房。',
    task: '告訴接線人員你住 512 號房。',
    words: 'room / five one two',
    objects: objects('512 號房', '305 號房')
  });
  Object.assign(variationSteps[1], {
    line: `${confirmation} for room five one two.`,
    zh: `512 號房送${itemZh}。`,
    task: `請飯店送${itemZh}到 512 號房。`,
    objects: objects(`512 號房：${itemZh}`, `305 號房：${itemZh}`)
  });
  return {
    id: water ? 'E2' : 'E3',
    key: water ? 'room-request-water' : 'room-extra-blanket',
    name: `報房號，再要${water ? '水' : '棉被'}`,
    role: towels.role,
    context: `你住 305 號房，打電話向飯店要${itemZh}。接線人員先確認房號；你回答後，再提出這次的需求。這一輪只練房號和${name}。`,
    steps: [room, request],
    words: [['room', '房間'], ['three oh five / five one two', '305／512'], [water ? 'some water' : 'extra blanket', water ? '一些水' : '額外棉被']],
    changeNote: `新增索取${name}的小輪，先教兩句「報房號＋提出需求」，後面的流程、真人接話與回顧沿用同兩句；變化只把房號從 305 改成 512，物品不變，飯店確認與操作選項也同步換房號。`,
    variationMode: 'change',
    variation: {
      task: `只把房號從 305 改成 512，仍需要${itemZh}。先報 512 號房，再用同一句提出需求；聽懂飯店確認會送到 512 號房。`,
      steps: variationSteps
    }
  };
}

module.exports = function applyApprovedDay8(day, tasks) {
  if (Number(day) !== 8) return tasks;
  const result = clone(tasks);
  const byKey = new Map(result.map(task => [task.key, task]));
  const required = ['check-in-name', 'passport-nights', 'breakfast-checkout', 'find-elevator', 'room-extra-towels', 'order-room-food', 'confirm-room-order', 'room-food-wait', 'report-room-problem'];
  for (const key of required) if (!byKey.has(key)) throw Error('Missing original Day 8 task: ' + key);

  // Append new rounds rather than inserting before the original F–I records.
  for (const kind of ['water', 'blanket']) {
    const added = supplyRound(byKey.get('room-extra-towels'), kind);
    const existingIndex = result.findIndex(task => task.key === added.key);
    if (existingIndex < 0) result.push(added);
    else result[existingIndex] = added;
  }

  const roomDescription = '分三輪練毛巾、水和棉被；每次只報房號，再提出一種需求。先練熟本輪的兩句與回顧，再換下一種用品。';
  const foodDescription = '依 F → H → G 分三輪練：說想要的餐點並問價格 → 問等多久 → 決定是否確認訂單。最後要訂或不訂都會練，每輪只練 1～2 句。';
  for (const task of result) {
    switch (task.key) {
      case 'check-in-name':
        chapter(task, 'day8-check-in', '提出入住與訂房姓名', 1, '先提出入住需求，再報訂房姓名；每次沿用同兩句練習。');
        break;
      case 'passport-nights':
        chapter(task, 'day8-passport-nights', '出示護照與確認晚數', 2, '接著出示護照，再回答住幾晚；兩晚、三晚分次練。');
        break;
      case 'breakfast-checkout':
        task.changeNote = '與找電梯合成住宿資訊一章，仍分兩輪練；本輪反覆練早餐與退房時間，原有 11 點、12 點變化完整保留。';
        chapter(task, 'day8-hotel-information', '住宿資訊：早餐、退房與電梯', 3, '先問早餐和退房時間，再練找電梯；C、D 各自練熟並完成回顧，不一次背三句。', 0);
        break;
      case 'find-elevator':
        task.changeNote = '與早餐、退房資訊合章，仍保留獨立電梯小輪；只練電梯問句，左邊與右邊的原聽力變化都保留。';
        chapter(task, 'day8-hotel-information', '住宿資訊：早餐、退房與電梯', 3, '先問早餐和退房時間，再練找電梯；C、D 各自練熟並完成回顧，不一次背三句。', 1);
        break;
      case 'room-extra-towels':
        task.changeNote = '毛巾、水、棉被合成客房用品需求一章，分 E、E2、E3 三輪；本輪保留報房號、索取兩條毛巾，以及改成一條毛巾的全部原句。';
        chapter(task, 'day8-room-supplies', '客房需求：毛巾、水與棉被', 4, roomDescription, 0);
        break;
      case 'room-request-water':
        chapter(task, 'day8-room-supplies', '客房需求：毛巾、水與棉被', 4, roomDescription, 1);
        break;
      case 'room-extra-blanket':
        chapter(task, 'day8-room-supplies', '客房需求：毛巾、水與棉被', 4, roomDescription, 2);
        break;
      case 'order-room-food':
        task.changeNote = '與等待時間、是否訂餐合成客房點餐一章，順序為 F → H → G；本輪仍只說餐點與問總價，全部原句及金額變化保留。';
        chapter(task, 'day8-room-service-order', '客房點餐：價格、時間與訂餐決定', 5, foodDescription, 0);
        break;
      case 'room-food-wait':
        task.context = '你已說想要總匯三明治，房號與價格也確認了，但還沒最後確認是否訂餐。現在先問送餐需要等多久，再決定要不要訂。';
        task.changeNote = '與餐點、總價及訂餐決定合章，排在 F 與 G 之間；情境改為尚未最後確認訂單時詢問等候時間，原問句與 20 分鐘、10 分鐘回話全部保留。';
        chapter(task, 'day8-room-service-order', '客房點餐：價格、時間與訂餐決定', 5, foodDescription, 1);
        break;
      case 'confirm-room-order':
        task.changeNote = '與餐點、價格及等候時間合章，排在 F、H 後面再做訂餐決定；保留 Yes, please. 與 No, thank you.，先看過再分次練兩種回答。';
        chapter(task, 'day8-room-service-order', '客房點餐：價格、時間與訂餐決定', 5, foodDescription, 2);
        break;
      case 'report-room-problem':
        chapter(task, 'day8-room-problem', '設備故障與請人查看', 6, '先說明哪項設備故障，再請人來查看；冷氣與電視情境分次練。');
        break;
    }
  }
  return result;
};
