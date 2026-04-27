# הגדרת האפליקציה

## שלב 1 — התקן Node.js
הורד מ-https://nodejs.org (גרסה LTS) והתקן.

## שלב 2 — קבל API Key חינמי
1. היכנס ל-https://finnhub.io/register
2. הירשם חינם
3. העתק את ה-API Key שלך

## שלב 3 — הגדר API Key
```bash
cd /Users/talamrani/stock-tracker
cp .env.local.example .env.local
```
פתח את `.env.local` והכנס את ה-API Key שלך:
```
FINNHUB_API_KEY=your_actual_key_here
```

## שלב 4 — הפעל
```bash
cd /Users/talamrani/stock-tracker
npm install
npm run dev
```

פתח ב-Safari (iPhone) או Chrome: http://localhost:3000

## להוסיף לאייפון כאפליקציה
1. פתח ב-Safari ב-iPhone
2. לחץ על כפתור השיתוף ↑
3. בחר "Add to Home Screen"
4. האפליקציה תופיע כאייקון ותרוץ כמו אפליקציה רגילה
