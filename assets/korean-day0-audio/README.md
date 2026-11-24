# 第 0 天韓文音檔

本目錄的 185 段 MP3 使用 OpenAI `gpt-4o-mini-tts` 的 `marin` 聲線朗讀，涵蓋教材句子、單字、數字與字音前導。其中 21 段多句錄音按原文順序組合本次生成的單句。音檔與跟讀時間內嵌於韓文教材 HTML，可離線播放。

情境數字由 `assets/korean-number-lessons.cjs` 編寫。數量練習涵蓋 1～10 個，問價與付款練習收錄 11 組完整金額，錄音連同量詞「개」或幣值單位「원」一起朗讀。

- `texts.json` 收錄各段錄音的文字。字音前導的實際朗讀內容以 `speakText || text` 為準。
- `manifest.json` 將韓文文字對應到 MP3 檔名。
- `timings.json` 保存詞段、文字位置與對應 MP3 的 SHA-256。沿用教材原來的詞段切分，依新錄音的聲音重新對齊起訖時間，供高亮及點詞重播使用。

舊版錄音由 `generate-day0-audio.py` 使用 Microsoft Edge TTS 的 `ko-KR-SunHiNeural` 聲線、`-10%` 語速產生，當時的詞段邊界由該服務提供。
