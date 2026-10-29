// One short first attempt per task. Keep the full checkpoint and its saved
// answers intact; entry-before/entry-after are a separate, same-question pair.
const prompts = {
  'micro-en-d2-merged-payment-bag-v1': '你已選好杯子，問店員能不能刷卡。',
  'micro-en-d3-merged-day3-entry-v1': '入境官員問旅行目的，告訴他你是來度假的。',
  'micro-en-d3-food-and-declaration-v1': '入境官員問你有沒有帶食物，你帶了餅乾，請如實回答。',
  'micro-en-d4-ticket-price-and-payment-v1': '出示到中央車站的單程票，問站務人員這張票多少錢。',
  'micro-en-d4-get-off-and-confirm-v1': '司機問你是不是去 River Market，而你的目的地正是那裡，回答沒錯。',
  'micro-en-d5-merged-day5-taxi-trip-v1': '司機問你要不要搭計程車，而你決定搭車，請回答他。',
  'micro-en-d6-merged-day6-dessert-and-coffee-v1': '店員問你想吃什麼甜點，告訴他你要巧克力蛋糕。',
  'micro-en-d6-steak-and-eggs-v1': '店員問牛排要幾分熟，告訴他你要五分熟。',
  'micro-en-d6-eat-in-and-finish-v1': '店員問內用或外帶，告訴他你要內用。',
  'micro-en-d8-passport-nights-v1': '櫃檯請你出示護照，遞出護照並回應。',
  'micro-en-d10-merged-day10-decline-and-reschedule-v1': '旅伴邀你今晚出去，但你已有安排，請禮貌婉拒。',
  'micro-en-d11-merged-day11-meet-companions-v1': '新旅伴問你來自哪裡，告訴他你來自臺灣。',
  'micro-en-d12-greeting-v1': '旅伴問你今天好不好，而你精神不錯，請回答他。',
  'micro-en-d14-identify-friend-v1': '眼前有兩個人，問旅伴哪一位是他的朋友。'
};

function addEntryCheckpoints(data) {
  if ((data.language || 'en') !== 'en') return data;
  for (const round of data.rounds) {
    const step = data.flows[round.flowIds[0]].steps[0];
    round.entryCheckpoint = {
      task: prompts[round.key] || step.task,
      words: step.words,
      answer: step.answer,
      answerZh: step.answerZh
    };
  }
  return data;
}
module.exports = { addEntryCheckpoints };
