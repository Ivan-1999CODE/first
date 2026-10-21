// Approved Day 5/6 changes are applied before the shared micro-lesson compiler.
// Keep the authored task keys and array order so existing round records survive.
const clone = value => JSON.parse(JSON.stringify(value));

function restoreAuthoredVariations(day, tasks) {
  const base = require('./curriculum-rounds.cjs').make(day);
  const authored = require('./micro-days-2-6.cjs')[day](base);
  const byKey = new Map(authored.map(task => [task.key, task]));
  for (const task of tasks) {
    const original = byKey.get(task.key);
    if (!original) continue;
    task.name = original.name;
    task.words = clone(original.words);
    task.variation = clone(original.variation);
    task.variationMode = 'change';
    delete task.additionalVariations;
  }
}

function chapter(task, id, name, order, description, position = 0) {
  task.chapter = { id, name, order, description, position };
}

function day5(tasks) {
  for (const task of tasks) {
    switch (task.key) {
      case 'directions-and-distance':
        task.changeNote = '保留問博物館路線與遠近的兩句主句；恢復第二個路口左轉的原變化與字彙，先看完整問答順序，再用同樣問題練路口聽辨。';
        chapter(task, 'day5-directions', '問路線與距離', 1, '先問博物館怎麼走，再確認遠近；第一、第二個路口分次練，學生沿用同樣兩個問題。');
        break;
      case 'taxi-and-destination':
        task.changeNote = '與車程、車資合為同一章，仍保留獨立小輪；先把接受搭車與說目的地兩句練熟，再進下一輪。原有飯店替換情境保留。';
        chapter(task, 'day5-taxi-trip', '搭計程車：目的地、車程與車資', 2, '分兩輪練：先決定搭車並說目的地，再問車程和車資。每輪先完成自己的回顧。', 0);
        break;
      case 'travel-time-and-fare':
        task.changeNote = '與搭車決定、目的地合章，但仍是獨立的兩句小輪；司機已知道目的地，這輪只練車程和車資。原有 20 分鐘聽力變化保留。';
        chapter(task, 'day5-taxi-trip', '搭計程車：目的地、車程與車資', 2, '分兩輪練：先決定搭車並說目的地，再問車程和車資。每輪先完成自己的回顧。', 1);
        break;
      case 'driver-and-pickup':
        chapter(task, 'day5-pickup', '確認司機與等車位置', 3, '確認預約司機，再說等車位置；維持原有兩句及已教的地點替換。');
        break;
      case 'dropoff-and-stop':
        task.changeNote = '保留 Would you like to get out here? 的聽力、指定入口與請停車兩句主句；恢復街角下車的原變化與字彙，先看對話順序，再分次練入口與街角。';
        chapter(task, 'day5-dropoff', '指定下車位置與停車', 4, '先指定下車位置，抵達後再請司機停車；入口與街角情境分次練。');
        break;
    }
  }
  return tasks;
}

function day6(tasks) {
  for (const task of tasks) {
    switch (task.key) {
      case 'recommend-and-order':
        task.changeNote = '保留請推薦與點雞肉三明治兩句；恢復番茄義大利麵的推薦、點餐變化與字彙，先看店員推薦後學生點餐的順序，再練同一組說法。';
        chapter(task, 'day6-main-course', '請推薦並點主餐', 1, '先請店員推薦，再點推薦餐點；雞肉三明治與番茄義大利麵分次練。');
        break;
      case 'more-time-to-choose':
        if (!task.words.some(([word]) => word === 'take your order')) task.words.push(['take your order', '幫你點餐']);
        task.coreNote = '先聽懂店員兩種點餐問法，同行時都用「請再給我們一點時間」回答。原本改成一個人用餐的變化也先看示範，再把我們換成我；各情境分次練。';
        task.changeNote = '保留 Are you ready to order? 與新增的 May I take your order?，同行時都回答 Could we have another minute, please?；另恢復原本用 I 請求時間的完整變化及字彙，作為額外示範與情境題。';
        chapter(task, 'day6-ordering-time', '還沒選好，請多一點時間', 2, '聽懂店員兩種點餐問法；同行或一人用餐的回答分次練，每次只練一組問答。');
        break;
      case 'dessert-choice':
        task.changeNote = '與咖啡偏好合章，仍分兩輪練；保留點巧克力蛋糕，恢復 No, thank you. 的原拒絕變化與字彙，先看同一問題的兩種回答再分次練。';
        chapter(task, 'day6-dessert-and-coffee', '甜點與咖啡', 3, '先練要不要甜點，再練咖啡偏好；每輪的不同回答先看示範，再分次使用。', 0);
        break;
      case 'coffee-preference':
        task.changeNote = '與甜點合章，仍保留獨立咖啡小輪；保留 Black, please.，恢復 With milk, please. 的原變化及字彙，兩種偏好分次練。';
        chapter(task, 'day6-dessert-and-coffee', '甜點與咖啡', 3, '先練要不要甜點，再練咖啡偏好；每輪的不同回答先看示範，再分次使用。', 1);
        break;
      case 'steak-and-eggs':
        task.changeNote = '保留牛排熟度與蛋的做法兩個主問答，以及全部圖片選項；恢復把示範牛排改為全熟、蛋維持炒蛋的原變化，先看對話順序再練，不要求背完菜單。';
        chapter(task, 'day6-steak-and-eggs', '牛排熟度與蛋的做法', 4, '先從圖片選單各選一種偏好，再反覆練相同問答；不用背完全部選項。');
        break;
      case 'price-and-cheaper-food':
        task.changeNote = '與確認金額合章但保留兩個獨立情境；本輪維持原餐點 12 美元及便宜蛋吐司 7.50 美元，恢復預算從 10 改 8 美元的原變化，問價與找便宜餐點仍用同樣兩句。';
        chapter(task, 'day6-price-and-confirmation', '問價格、找便宜餐點與確認金額', 5, '分兩個獨立情境：先比較 12 美元餐點和 7.50 美元蛋吐司；另一輪確認另一筆 8.50 美元帳單並請重說。', 0);
        break;
      case 'eat-in-and-finish':
        task.changeNote = '保留內用與不再加點兩句主句，恢復 To go, please. 的原外帶變化；內用、外帶各自先看問答順序，再用同一句結束點餐。';
        chapter(task, 'day6-finish-ordering', '說內用或外帶並結束點餐', 6, '回答要內用或外帶，再說不再加點；兩種用餐方式分次練。');
        break;
      case 'confirm-price-and-repeat':
        task.context = '這是另一筆獨立點餐的帳單，與前面比較價格的餐點不同。這筆點餐已完成，你剛才聽到的總價似乎是 8 美元 50 分。先確認這個金額；店裡有點吵，再請店員重說一次。';
        task.steps[0].task = '這是另一筆已完成點餐的帳單；你剛聽到似乎是 8 美元 50 分，先問是不是這個金額。';
        task.changeNote = '與問價、找便宜餐點合章但仍獨立練；主情境明確交代這是另一筆 8.50 美元帳單，並恢復本輪改成 7.50 美元的原確認、重說變化與字彙。這是本輪的金額替換，不代表接續前一筆交易。';
        chapter(task, 'day6-price-and-confirmation', '問價格、找便宜餐點與確認金額', 5, '分兩個獨立情境：先比較 12 美元餐點和 7.50 美元蛋吐司；另一輪確認另一筆 8.50 美元帳單並請重說。', 1);
        break;
    }
    if (task.key === 'more-time-to-choose') {
      task.additionalVariations = [clone(task.variation)];
      task.variationMode = 'core';
      task.variation = {
        task: '你和旅伴仍在看菜單，還沒決定。店員這次用「可以幫你們點餐了嗎？」來詢問；同樣請店員再給你們一點時間。',
        steps: clone(task.steps)
      };
      task.variation.steps[0].line = 'May I take your order?';
      task.variation.steps[0].zh = '可以幫你們點餐了嗎？';
    }
  }
  return tasks;
}

module.exports = function applyApprovedDay5And6(day, tasks) {
  if (Number(day) !== 5 && Number(day) !== 6) return tasks;
  const result = clone(tasks);
  restoreAuthoredVariations(Number(day), result);
  return Number(day) === 5 ? day5(result) : day6(result);
};
