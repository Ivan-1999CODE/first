// Approved Day 9 groups. Remove only B; keep the original labels and sentences
// of the surviving tasks so each short practice remains easy to identify.
const clone = value => JSON.parse(JSON.stringify(value));

function chapter(task, id, name, order, description, position) {
  task.chapter = { id, name, order, description, position };
}

module.exports = function applyApprovedDay9(day, tasks) {
  if (Number(day) !== 9) return tasks;
  const result = clone(tasks).filter(task => task.key !== 'answer-party-day');
  const ids = {
    'book-table-date': 'A',
    'answer-time-name': 'C',
    'availability-later': 'D',
    'change-booking-time': 'E',
    'decline-booking': 'F',
    'adult-price-quantity': 'G',
    'child-ticket-total': 'H',
    'entry-card': 'I',
    'payment-choice': 'J'
  };
  const byKey = new Map(result.map(task => [task.key, task]));
  for (const key of Object.keys(ids)) if (!byKey.has(key)) throw Error('Missing original Day 9 task: ' + key);

  const bookingDescription = '分 A、C 兩輪練訂位：A 練提出需求與完整日期時間；C 是另一種問法的獨立小情境，練時間短答與姓名。各輪只練 2 句，時間問題不在同一通電話重問。';
  const changesDescription = '分 D、E、F 三個獨立情境：尚未訂位時接受替代時間 → 已有訂位時要求改時間 → 時間不合而暫時不訂。每輪重看自己的起點，練 1～2 句；接受與婉拒都保留。';
  const ticketsDescription = '主情境分兩輪接續：G 問單價並買 2 張成人票；H 加 1 張兒童票、確認總共 25 美元。各輪變化另練，不把 G 的 1 張成人票帶入 H；H 始終從 2 張成人票開始。';
  const paymentDescription = '先練入場時間與能否刷卡，再回答要用現金或刷卡；I、J 各自練熟並回顧，每輪只練 1～2 句。';

  for (const task of result) {
    if (ids[task.key]) task.id = ids[task.key];
    switch (task.key) {
      case 'book-table-date':
        task.changeNote = '刪除原 B 短答人數與日期任務，A 與 C 合成訂位一章；本輪仍只練提出兩人桌需求及完整日期時間，四人桌的原變化保留。C 是另一種問法，分開練。';
        chapter(task, 'day9-booking-basics', '訂位：提出需求、時間與姓名', 1, bookingDescription, 0);
        break;
      case 'answer-time-name':
        task.context = '這是另一種訂位問法的獨立小情境，重新開始練，不接在 A 已回答日期時間的對話後面。餐廳只知道你明天有兩位用餐，還不知道時間與姓名；你要晚上 7 點，訂位姓名是 Alex Chen。';
        task.changeNote = '與 A 合章，保留時間短答、訂位姓名及 Jamie Lin 的原變化；中文情境說明這是另一種問法，避免在 A 已回答時間後又重問一次。';
        chapter(task, 'day9-booking-basics', '訂位：提出需求、時間與姓名', 1, bookingDescription, 1);
        break;
      case 'availability-later':
        task.context = '這一輪從尚未訂位開始，與後面更改、婉拒的情境分開練。餐廳已知道你想訂今晚兩人桌；你先問 7 點有沒有空位，7 點客滿後，對方提供 7 點半，而你能接受。';
        task.changeNote = '與更改時間、暫時不訂合章，但三輪有不同起點；本輪保留詢問空位與接受較晚時間，以及接受 8 點的原變化，不把本輪決定帶到下一個獨立情境。';
        chapter(task, 'day9-booking-changes', '訂位調整：替代時間、更改與婉拒', 2, changesDescription, 0);
        break;
      case 'change-booking-time':
        task.context = '這是另一筆已有訂位的獨立情境，不接續 D 剛接受的時間。你原本訂了今晚 7 點的兩人桌，餐廳已找到你的訂位；現在想把時間改成 6 點半，只需要提出改時間的需求。';
        task.changeNote = '與詢問空位、暫時不訂合章，仍獨立練一句更改需求；起點明確是另一筆原訂 7 點的訂位，保留改成 6 點半或 8 點半的全部原句。';
        chapter(task, 'day9-booking-changes', '訂位調整：替代時間、更改與婉拒', 2, changesDescription, 1);
        break;
      case 'decline-booking':
        task.context = '這是另一個尚未成立訂位的獨立情境，不是取消 D 或 E 的訂位。你想今晚和旅伴吃飯，但餐廳只剩晚上 9 點；這對你太晚，你決定禮貌表示暫時不訂。';
        task.changeNote = '與接受替代時間、更改已有訂位合章；本輪仍從尚未訂位開始，只練禮貌表示暫時不訂，保留餐廳只剩 9 點或 8 點的原聽力變化。';
        chapter(task, 'day9-booking-changes', '訂位調整：替代時間、更改與婉拒', 2, changesDescription, 2);
        break;
      case 'adult-price-quantity':
        task.context = '你在景點售票處，先想知道成人票每張多少錢，再買兩張成人票。這是 G、H 接續練習的主情境，金額是教學設定；本輪另換成一張成人票的變化只在本輪練，不帶入 H。';
        task.changeNote = '與加兒童票、問總價合章；主情境仍買 2 張成人票，接 H 加 1 張兒童票。原本只買 1 張成人票的變化完整保留並分開練，避免接到 H 的 25 美元總價。';
        chapter(task, 'day9-ticket-quantity-total', '買門票：票價、數量與總價', 3, ticketsDescription, 0);
        break;
      case 'child-ticket-total':
        task.context = '這一輪回到主情境：售票員已幫你選好兩張成人票，每張 10 美元。你還要加一張 5 美元的兒童票，接著問全部票的總價；不沿用 G 變化題的一張成人票。';
        task.changeNote = '與成人票價、數量合章，主情境依 2 張成人票加 1 張兒童票得到 25 美元；保留加 2 張兒童票後總價 30 美元的全部原變化，成人票始終維持 2 張。';
        chapter(task, 'day9-ticket-quantity-total', '買門票：票價、數量與總價', 3, ticketsDescription, 1);
        break;
      case 'entry-card':
        task.changeNote = '與回答付款方式合章，仍保留獨立的入場與刷卡詢問小輪；10 點、11 點入場的全部原句保留，先練熟兩句再接 J 選擇付款方式。';
        chapter(task, 'day9-entry-payment', '入場資訊與付款方式', 4, paymentDescription, 0);
        break;
      case 'payment-choice':
        task.changeNote = '與入場時間及能否刷卡合章；本輪只回答售票員的付款方式問題，Card, please. 與 Cash, please. 都保留，分次練刷卡與現金。';
        chapter(task, 'day9-entry-payment', '入場資訊與付款方式', 4, paymentDescription, 1);
        break;
    }
  }
  return result;
};
