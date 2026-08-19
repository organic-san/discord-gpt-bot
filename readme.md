### athena no.4 Discord bot
- chatgpt api access
- server moderation
- span detect
  
default .env file:
```
DISCORD_TOKEN=
GEMINI_API_KEY=
BOT_USERID=
AUTHOR_USERID=
MAIN_GUILDID=
DEFAULT_MODEL=gemini-3.5-flash-lite
DATABASE_URL=
BACKUP_DIR=
GEMINI_INPUT_PRICE_PER_M=0.30
GEMINI_OUTPUT_PRICE_PER_M=2.50
GEMINI_THINKING_LEVEL=MINIMAL
GEMINI_MAX_OUTPUT_TOKENS=2048
```

`GEMINI_THINKING_LEVEL` 可設 `MINIMAL` / `LOW` / `MEDIUM` / `HIGH`。
thinking token 會計入 `GEMINI_MAX_OUTPUT_TOKENS`，也依 output 費率計價，
調高 thinking 等級時請一併調高輸出上限，否則回應會被截斷成空內容。

contact: 
Discord @organic_kaami