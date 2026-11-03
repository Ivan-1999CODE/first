// A new task with its own stable key; existing A/B answers stay in place.
module.exports = function firstVisitTask() {
  const question = 'Have you been here before?';
  const questionZh = '你以前來過這裡嗎？';
  const no = 'No, it’s my first time.';
  const noZh = '沒有，這是我第一次來。';
  const yes = 'Yes, I’ve been here before.';
  const yesZh = '有，我以前來過。';
  const back = 'How about you?';
  const backZh = '那你呢？';
  const step = (id, label, answer, answerZh, line, zh, task, words, options, askFirst) => ({
    id, label, answer, answerZh, line, zh, task, words, askFirst,
    opening: askFirst ? answerZh : zh,
    objects: options.map(text => ['▣', text]), valid: [0],
    effect: '✓ 已更新旅行卡，繼續聊聊彼此的到訪經驗。'
  });
  const ask = step('ask-before', '問對方以前來過嗎', question, questionZh, yes, yesZh,
    '你和旅伴正在這座城市旅行。先問對方以前有沒有來過這裡。', 'have you / been here / before',
    ['旅伴以前來過', '旅伴第一次來'], true);
  const first = step('first-time', '回答自己第一次來', no, noZh, back, backZh,
    '旅伴把問題問回來。你是第一次到這座城市，告訴他。', 'no / my first time',
    ['我第一次來；旅伴以前來過', '我以前來過；旅伴第一次來'], false);
  const visited = step('been-before', '回答自己以前來過', yes, yesZh, question, questionZh,
    '這次你以前來過這座城市。聽到旅伴的問題，回答自己的到訪經驗。', 'yes / been here / before',
    ['我以前來過', '我第一次來'], false);
  const askBack = step('ask-back', '把到訪經驗問回去', back, backZh, no, noZh,
    '你已回答自己以前來過。接著把同一個問題問回去，再聽旅伴的回答。', 'how / about / you',
    ['旅伴第一次來', '旅伴以前來過'], true);
  return {
    id: 'G', key: 'first-visit-chat', name: '你是第一次來嗎？', role: '旅伴', icon: '💬',
    chapter: {id:'day11-first-visit', name:'你是第一次來嗎？', order:3, position:0,
      description:'聊聊彼此以前有沒有來過；練習第一次來、以前來過，以及把問題問回去。'},
    context: '你是第一次到這座城市，和新認識的旅伴聊天。先問他以前有沒有來過；他回答後問「那你呢？」，你再說自己是第一次來。',
    steps: [ask, first],
    variationMode: 'core',
    variation: {
      task:'這次換成你以前來過這座城市，由旅伴先問你。回答自己的到訪經驗，再把問題問回去，聽懂對方的回答。',
      steps:[visited, askBack]
    },
    coreNote:'先練主動提問與「第一次來」，再換成「以前來過」並問回去。Have you been here before? 當成整句問法練習；here 指你們現在所在的地方。兩種回答依情境選一句。',
    words:[['been here','來過這裡'], ['before','以前'], ['first time','第一次'], ['How about you?','那你呢？']],
    homeQuizSteps:[{...ask,distractor:noZh}, {...askBack,distractor:yesZh}],
    changeNote:'新增到訪經驗聊天任務；四個說法先在第二部分學，再用於兩種完整接話、情境題、師生共練與課後挑戰。'
  };
};
