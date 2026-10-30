# 第 0 天日文音檔

音檔只包含編寫好的教材句子、單字及字音前導，不包含學生作答。

- 聲音：Microsoft Edge TTS `ja-JP-NanamiNeural`，語速 `-10%`。
- `texts.json`：實用章節、字音前導及全部既有音檔的文字清單。
- `manifest.json`：文字與 MP3 檔名對照。
- `timings.json`：同次合成取得的詞段邊界、文字位置及音檔 SHA-256。
- 平假名與片假名共用對應字音；「は／へ」特別以「ハ／ヘ」錄音，避免被合成器當助詞。實際播放文字以 `speakText || text` 為準。

更新資料後，先執行 `node --preserve-symlinks --preserve-symlinks-main prepare-day0-practical-audio.cjs`，再以 Python 執行 `generate-day0-audio.py --deps-dir tmp/korean-audio-deps`，最後執行同一準備腳本的 `--check`。Python 加上 `-X utf8` 可避免終端的日韓文字編碼問題。

`--deps-dir` 指向現有可用的 Edge TTS 套件，不影響使用的日文聲音。這台工作區的舊 `tmp/japanese-audio-deps` 曾遭語音服務以 403 拒絕；較新的 `tmp/korean-audio-deps` 已驗證可合成兩種語言。

準備腳本保留既有文字與音檔；合成腳本重用 SHA 相符的已完成音檔。新增音檔和對應時間全部成功後才更新正式清單。建置後音檔及時間資料內嵌於 HTML，播放不需要連線。詞段邊界不是逐字母的音素時間。
