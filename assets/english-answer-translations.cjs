// Authored meanings for student references in the current English lessons.
// Join only known, complete sentences at build time; never guess a missing meaning.
const meanings = new Map(`
Excuse me.|不好意思。
How do I get to the train station?|請問火車站怎麼走？
Can I walk there?|我可以走路去嗎？
How do I get to the post office?|請問郵局怎麼走？
Turn right at the second intersection?|在第二個路口右轉嗎？
Thank you.|謝謝。
The train station, please.|我要去火車站，謝謝。
The post office, please.|我要去郵局，謝謝。
Yes, please.|好的，麻煩你。
No, thank you.|不用了，謝謝。
I understand.|我明白了。
The second intersection?|第二個路口嗎？
Turn left?|左轉嗎？
Thank you for your help.|謝謝你的幫忙。
I'm going to the post office.|我要去郵局。
Could you show me the way?|可以告訴我怎麼走嗎？
Could you say that again?|可以請你再說一次嗎？
Could you show me on the map?|可以在地圖上指給我看嗎？
Can I take a bus?|我可以搭公車嗎？
How do I get to the bus stop?|請問公車站怎麼走？
Turn right?|右轉嗎？
I'm going to the police station.|我要去警局。
I'm looking for a gift.|我想找一份禮物。
How much is this mug?|這個馬克杯多少錢？
Can I pay by card?|我可以刷卡嗎？
I'd like three bottles of water.|我想要 3 瓶水。
How much are they?|這些總共多少錢？
Okay.|好的。
I'll pay in cash.|我付現金。
I'll take it.|我要買這個。
Card, please.|我刷卡，謝謝。
Cash, please.|我付現金，謝謝。
I'm looking for a T-shirt.|我想找一件 T 恤。
I'm looking for a hat.|我想找一頂帽子。
Medium, please.|我要 M 號，謝謝。
Large, please.|我要 L 號，謝謝。
I'd like the blue one.|我想要藍色的那個。
Do you have something cheaper?|有便宜一點的嗎？
Three bottles, please.|我要 3 瓶，謝謝。
Two bottles, please.|我要 2 瓶，謝謝。
Can I try it on?|我可以試穿嗎？
I'd like two bottles of water.|我想要 2 瓶水。
How much are they.|這些總共多少錢？
How much is this?|這個多少錢？
I'd like the black T-shirt.|我想要黑色的 T 恤。
I have ten dollars.|我有 10 美元。
Do you have this in medium?|這款有 M 號嗎？
I have eight dollars.|我有 8 美元。
Do you have this in large?|這款有 L 號嗎？
I'd like the blue hat.|我想要藍色的帽子。
I'd like to check in.|我想辦理登機手續。
One bag, please.|我要托運 1 件行李，謝謝。
An aisle seat, please.|我想要靠走道的座位，謝謝。
Two bags, please.|我要托運 2 件行李，謝謝。
A window seat, please.|我想要靠窗的座位，謝謝。
I'm here on vacation.|我是來度假的。
I'm here on business.|我是來出差的。
Seven days.|7 天。
Two weeks.|2 週。
At Sunny Hotel.|住在 Sunny Hotel。
With a friend.|住在朋友家。
Yes, I have some cookies.|有，我有帶一些餅乾。
No, I don't have any food.|沒有，我沒有帶食物。
Could you say that again, please?|可以請你再說一次嗎？
Which gate should I go to?|我應該去哪個登機門？
Do I need to declare this?|這個需要申報嗎？
I have two bags to check in.|我有 2 件行李要托運。
Could you speak more slowly, please?|可以請你說慢一點嗎？
Central Station, please.|我要去中央車站，謝謝。
Single, please.|我要單程票，謝謝。
How much is it?|多少錢？
One ticket to Central Station, please.|我要 1 張到中央車站的票，謝謝。
The airport, please.|我要去機場，謝謝。
Return, please.|我要來回票，謝謝。
One ticket, please.|我要 1 張票，謝謝。
Two tickets, please.|我要 2 張票，謝謝。
Yes, that's right.|對，沒錯。
No, Central Station, please.|不是，我要去中央車站，謝謝。
What time does it leave?|幾點出發？
Which platform?|在哪個月台？
Which line should I take?|我應該搭哪一條線？
Which bus should I take?|我應該搭哪一班公車？
Does this bus go to River Market?|這班公車有到河畔市場嗎？
Where do I change?|我要在哪裡轉車？
Where should I get off?|我應該在哪裡下車？
Two tickets to the airport, please.|我要 2 張到機場的票，謝謝。
Does this bus go to the airport?|這班公車有到機場嗎？
How do I get to the museum?|請問博物館怎麼走？
Is it far?|遠嗎？
Yes, I'm looking for the City Museum.|是的，我在找市立博物館。
Yes, I'm looking for the train station.|是的，我在找火車站。
The City Museum, please.|我要去市立博物館，謝謝。
Sunny Hotel, please.|我要去 Sunny Hotel，謝謝。
Yes, I'll take a taxi.|好，我要搭計程車。
No, thanks.|不用了，謝謝。
I'll walk.|我用走的。
I'm outside the hotel entrance.|我在飯店入口外面。
I'm at the museum entrance.|我在博物館入口。
Yes, here is fine.|好，這裡就可以了。
At the entrance, please.|請在入口停車，謝謝。
Can you take me to the museum, please?|可以請你載我去博物館嗎？
How long does it take?|要花多久時間？
How much will it be?|車資要多少錢？
Are you my Uber driver?|你是我叫的 Uber 司機嗎？
Could you stop here, please?|可以請你在這裡停車嗎？
Can you take me to Sunny Hotel, please?|可以請你載我去 Sunny Hotel 嗎？
What do you recommend?|你推薦什麼？
I'd like a chicken sandwich, please.|我想要一份雞肉三明治，謝謝。
Not yet.|還沒準備好。
Could we have another minute, please?|可以再給我們一點時間嗎？
Yes.|是的。
I'd like the chicken sandwich, please.|我想要雞肉三明治，謝謝。
I'll have the tomato pasta, please.|我要番茄義大利麵，謝謝。
I'll have the chicken sandwich, please.|我要雞肉三明治，謝謝。
Chocolate cake, please.|我要巧克力蛋糕，謝謝。
I'm full.|我吃飽了。
Well-done, please.|我要全熟，謝謝。
Scrambled, please.|我要炒蛋，謝謝。
Sunny-side up, please.|我要單面煎的荷包蛋，謝謝。
Black, please.|我要黑咖啡，謝謝。
With milk, no sugar, please.|請加牛奶，不加糖，謝謝。
For here, please.|我要內用，謝謝。
To go, please.|我要外帶，謝謝。
Is there a cheaper one?|有便宜一點的嗎？
Is it eight dollars fifty?|是 8 美元 50 美分嗎？
That's all, thank you.|就這些，謝謝。
Medium-rare, please.|我要三分熟，謝謝。
Poached, please.|我要水波蛋，謝謝。
Do you have a cheaper option?|有便宜一點的選擇嗎？
Is it seven dollars fifty?|是 7 美元 50 美分嗎？
Blue, please.|我要藍色的，謝謝。
Do you have this in another size?|這款有其他尺寸嗎？
I'm just looking, thank you.|我只是看看，謝謝。
Green, please.|我要綠色的，謝謝。
Pink, please.|我要粉紅色的，謝謝。
It's a little too tight.|有一點太緊了。
It fits well.|穿起來很合身。
It's too loose.|太鬆了。
Do you have a smaller one?|有小一點的嗎？
Can I try this on?|我可以試穿這件嗎？
Where are the fitting rooms?|試衣間在哪裡？
It's too small.|太小了。
Do you have a bigger one?|有大一點的嗎？
I like this one better.|我比較喜歡這一件。
Do you have this in another color?|這款有其他顏色嗎？
It's too big.|太大了。
I'd like to check in, please.|我想辦理入住，謝謝。
I have a reservation under Alex Chen.|我有訂房，訂房姓名是 Alex Chen。
Here is my passport.|這是我的護照。
Two nights.|住 2 晚。
I have a reservation under Jamie Lin.|我有訂房，訂房姓名是 Jamie Lin。
I'm staying for three nights.|我要住 3 晚。
Room three oh five.|305 號房。
Room five one two.|512 號房。
Two, please.|2 位，謝謝。
Just one, please.|只要 1 條，謝謝。
How long will it take?|要等多久？
I won't order anything for now.|我暫時不訂餐了。
Is breakfast included?|有包含早餐嗎？
What time is check-out?|幾點退房？
Where is the elevator?|電梯在哪裡？
Could I have two extra towels, please?|可以再給我 2 條毛巾嗎？
I'd like a club sandwich, please.|我想要一份總匯三明治，謝謝。
How much is it in total?|總共多少錢？
Hi, this is room three oh five.|你好，這裡是 305 號房。
The air conditioner isn't working.|冷氣壞了。
Could someone come and check it, please?|可以請人過來檢查一下嗎？
Three nights.|住 3 晚。
Hi, this is room five one two.|你好，這裡是 512 號房。
Could I have one extra towel, please?|可以再給我 1 條毛巾嗎？
Tomorrow, please.|我要訂明天的，謝謝。
Seven p.m., please.|晚上 7 點，謝謝。
It's under Alex Chen.|預約姓名是 Alex Chen。
I'd like to book a table for three for tomorrow at six thirty p.m.|我想訂明天晚上 6 點半、3 位用餐的座位。
The name is Jamie Lin.|姓名是 Jamie Lin。
I'd like one adult ticket for tomorrow, please.|我想要 1 張明天的成人票，謝謝。
What time can I enter?|我幾點可以入場？
Four, please.|4 位，謝謝。
Today, please.|我要訂今天的，謝謝。
Six thirty p.m., please.|晚上 6 點半，謝謝。
It's under Jamie Lin.|預約姓名是 Jamie Lin。
Two adult tickets, please.|我要 2 張成人票，謝謝。
One adult ticket and one child ticket, please.|我要 1 張成人票和 1 張兒童票，謝謝。
Seven thirty is fine, thank you.|7 點半可以，謝謝。
I won't book it for now.|我暫時先不預訂了。
Could we change it to six thirty?|可以改成 6 點半嗎？
How much is an adult ticket?|成人票多少錢？
One child ticket as well, please.|還要 1 張兒童票，謝謝。
What time can we enter?|我們幾點可以入場？
I'd like to book a table for four, please.|我想訂 4 位用餐的座位，謝謝。
For today at six thirty p.m., please.|我要訂今天晚上 6 點半，謝謝。
Could I have two napkins, please?|可以給我 2 張餐巾紙嗎？
Could you help me with this bag, please?|可以請你幫我拿這個袋子嗎？
Thanks for asking, but I can't tonight.|謝謝你的邀請，不過我今晚沒辦法。
I already have plans.|我已經有安排了。
I'm sorry to keep you waiting.|不好意思，讓你久等了。
Two napkins, please.|我要 2 張餐巾紙，謝謝。
Some water, please.|請給我一些水，謝謝。
Three, please.|3 張，謝謝。
Yes, I'd love to.|好啊，我很樂意。
Yes, I'm okay.|嗯，我沒事。
My arm hurts a little.|我的手臂有一點痛。
Yes, thank you.|好的，謝謝。
I'm okay.|我沒事。
Could I have some water, please?|可以給我一些水嗎？
Maybe tomorrow?|明天可以嗎？
I'm sorry.|對不起。
Are you okay?|你還好嗎？
Let me help you.|讓我幫你。
That's okay.|沒關係。
No problem.|沒問題。
I'm from Taiwan.|我來自台灣。
I'm traveling with my family.|我和家人一起旅行。
How about you?|你呢？
I'm from Taipei.|我來自台北。
I'm traveling with a friend.|我和一位朋友一起旅行。
I like taking photos.|我喜歡拍照。
I like reading.|我喜歡閱讀。
It was great.|很棒。
It was nice, but a little crowded.|不錯，不過有點擁擠。
I can't find my phone.|我找不到手機。
I can't find my wallet.|我找不到錢包。
Thanks.|謝謝。
Nice to meet you.|很高興認識你。
That sounds fun.|聽起來很好玩。
Yeah, it was crowded.|對，人很多。
How about the museum?|去博物館怎麼樣？
How do we get there?|我們要怎麼去那裡？
I'm doing well.|我很好。
How are you?|你好嗎？
I'm a little tired.|我有一點累。
Okay, thanks.|好的，謝謝。
How about the park?|去公園怎麼樣？
How long should we stay?|我們要待多久？
Let's leave at ten thirty.|我們 10 點半出發吧。
When's the next bus?|下一班公車是幾點？
We'll wait, thanks.|我們會等，謝謝。
Three adult tickets, please.|我要 3 張成人票，謝謝。
How much is that altogether?|那些全部加起來多少錢？
Let's take it easy today.|我們今天輕鬆一點吧。
Let's leave at ten.|我們 10 點出發吧。
How much is a ticket?|一張票多少錢？
I'm tired.|我累了。
Can we take the bus?|我們可以搭公車嗎？
Let's go to the museum.|我們去博物館吧。
It's too hot outside.|外面太熱了。
It's too cold outside.|外面太冷了。
Can we take a taxi?|我們可以搭計程車嗎？
I'm thirsty.|我渴了。
Can we take a break?|我們可以休息一下嗎？
Water, please.|我要水，謝謝。
Tea, please.|我要茶，謝謝。
Sounds good.|聽起來不錯。
Where do we meet?|我們在哪裡集合？
What time do we leave?|我們幾點出發？
Sorry, could you say that again?|不好意思，可以請你再說一次嗎？
Where are we going?|我們要去哪裡？
The museum, right?|博物館，對嗎？
What time do we get back?|我們幾點回來？
Which one is your friend?|哪一位是你的朋友？
Ten, at the entrance.|10 點，在入口。
Right?|對嗎？
The beach, right?|海灘，對嗎？
Nine, in the lobby.|9 點，在大廳。
`.trim().split('\n').map(line => line.split('|')));

// The same short answer can refer to steak, clothing, towels or people.
const dayMeanings = {
  6: {'Medium, please.': '我要五分熟，謝謝。', 'Yes.': '準備好了。'},
  8: {'Two, please.': '我要 2 條，謝謝。'},
  10: {
    'Two, please.': '我要 2 張，謝謝。',
    "I'm okay.": '我不需要。',
    "No, thank you. I'm okay.": '不用了，謝謝。我不需要。'
  }
};
const normalize = text => text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
function translate(answer, day) {
  const normalized = normalize(answer), local = dayMeanings[day] || {};
  if (local[normalized]) return local[normalized];
  if (meanings.has(normalized)) return meanings.get(normalized);
  return normalized.split(/(\s+\/\s+)|(?<=[.!?])\s+/).filter(Boolean).map(part => {
    if (/^\s+\/\s+$/.test(part)) return '／';
    const zh = local[part] || meanings.get(part);
    if (!zh) throw Error(`Missing English reference translation: Day ${day}: ${part}`);
    return zh;
  }).join('');
}
function referenceAnswers(d) {
  return [...new Set([
    d.course.answer, d.homeAnswer,
    ...d.phrases.map(p => p.remix),
    ...d.replies.flatMap(q => [q.answer, q.changeAnswer]),
    ...d.flows.flatMap(f => f.steps.flatMap(t => [t.answer, ...Object.values(t.when?.cases || {}).map(c => c.answer)])),
    ...d.missions.map(m => m.answer), ...d.pairs.map(p => p.answer),
    ...(d.reviewTasks || []).map(t => t.answer)
  ].filter(Boolean))];
}
function addAnswerTranslations(d) {
  d.answerTranslations = Object.fromEntries(referenceAnswers(d).map(answer => [answer, translate(answer, d.course.day)]));
  return d;
}
module.exports = {addAnswerTranslations};
