# 第 0 天日文音檔

本目錄的 200 段 MP3 使用 OpenAI `gpt-4o-mini-tts` 的 `marin` 聲線朗讀，內容為教材句子、單字及字音前導。其中 28 段多句錄音按原文順序組合本次生成的單句。音檔與跟讀時間內嵌於日文教材 HTML，可離線播放。

情境數字由 `assets/japanese-number-lessons.cjs` 編寫。數量涵蓋 `ひとつ` 到 `とお` 共 10 組，價格則有 21 組含「円」的完整金額。

- `texts.json` 收錄實用章節、字音前導及各段錄音的文字。平假名與片假名共用對應字音，「は／へ」採用「ハ／ヘ」的發音提示。實際朗讀文字以 `speakText || text` 為準。
- `manifest.json` 將文字對應到 MP3 檔名。
- `timings.json` 保存詞段、文字位置與對應 MP3 的 SHA-256。沿用教材原來的詞段切分，依新錄音的聲音重新對齊起訖時間，供高亮及點詞重播使用。

舊版錄音由 `generate-day0-audio.py` 使用 Microsoft Edge TTS 的 `ja-JP-NanamiNeural` 聲線、`-10%` 語速產生，當時的詞段邊界由該服務提供。
