// Atlas cells run left to right, then top to bottom (3 columns, 4 rows).
const steak=[
 ['Rare','一分熟','中心偏紅。',0],
 ['Medium-rare','三分熟','中心紅潤、外圍較熟。',1],
 ['Medium','五分熟','中心呈粉紅色。',2],
 ['Medium-well','七分熟','中心只留少量粉紅色。',3],
 ['Well-done','全熟','內部熟透，幾乎沒有粉紅色。',4]
];
const eggs=[
 ['Scrambled','炒蛋','打散後拌炒。',5],
 ['Sunny-side up','單面煎蛋','不翻面，蛋黃保持流心。',6],
 ['Over easy','翻面稍煎','兩面稍煎，蛋黃仍流心。',7],
 ['Poached','水波蛋','去殼入水煮，蛋白包住流心蛋黃。',8],
 ['Soft-boiled','半熟水煮蛋','帶殼水煮，蛋黃未全熟。',9],
 ['Hard-boiled','全熟水煮蛋','帶殼水煮，蛋白與蛋黃都熟透。',10]
];
const convert=rows=>rows.map(([en,zh,description,cell])=>({en,zh,description,cell}));
module.exports={steak:convert(steak),eggs:convert(eggs)};
