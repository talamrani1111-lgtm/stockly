export type QuizQuestion = {
  question: { he: string; en: string };
  options: { he: string; en: string }[];
  correct: number;
  explanation: { he: string; en: string };
};

export type LessonQuiz = {
  lessonId: string;
  questions: QuizQuestion[];
};

const quizData: LessonQuiz[] = [
  {
    lessonId: "what-is-stock",
    questions: [
      {
        question: {
          he: "מה מייצגת מניה של חברה?",
          en: "What does a company stock represent?",
        },
        options: [
          { he: "הלוואה שנתת לחברה", en: "A loan you gave to the company" },
          { he: "חלק בבעלות על החברה", en: "A share of ownership in the company" },
          { he: "חוזה לרכישת מוצר עתידי", en: "A contract to purchase a future product" },
          { he: "ערבות בנקאית", en: "A bank guarantee" },
        ],
        correct: 1,
        explanation: {
          he: "מניה מייצגת חלק בבעלות על החברה. בעל מניה הוא שותף חלקי בחברה.",
          en: "A stock represents a share of ownership in the company. A shareholder is a partial owner of the company.",
        },
      },
      {
        question: {
          he: "היכן נסחרות מניות של חברות ציבוריות?",
          en: "Where are publicly traded company stocks bought and sold?",
        },
        options: [
          { he: "בבנק המרכזי", en: "At the central bank" },
          { he: "במשרד האוצר", en: "At the treasury department" },
          { he: "בבורסה לניירות ערך", en: "On a stock exchange" },
          { he: "במשרדי החברה", en: "At the company's offices" },
        ],
        correct: 2,
        explanation: {
          he: "מניות נסחרות בבורסות כמו NYSE, NASDAQ ובורסת תל אביב — שווקים מרכזיים למסחר בניירות ערך.",
          en: "Stocks are traded on exchanges like NYSE, NASDAQ, and the Tel Aviv Stock Exchange — central markets for trading securities.",
        },
      },
      {
        question: {
          he: "מה משפיע בעיקר על מחיר המניה בשוק?",
          en: "What primarily influences a stock's market price?",
        },
        options: [
          { he: "גובה השכר של המנכ\"ל", en: "The CEO's salary" },
          { he: "גיל החברה", en: "The age of the company" },
          { he: "היצע וביקוש בשוק", en: "Supply and demand in the market" },
          { he: "מספר העובדים", en: "The number of employees" },
        ],
        correct: 2,
        explanation: {
          he: "מחיר המניה נקבע על פי היצע וביקוש — כמה קונים רוצים לקנות מול כמה מוכרים רוצים למכור.",
          en: "Stock price is determined by supply and demand — how many buyers want to buy versus how many sellers want to sell.",
        },
      },
      {
        question: {
          he: "מהו דיבידנד?",
          en: "What is a dividend?",
        },
        options: [
          { he: "עמלת מסחר שמשלמים לבורסה", en: "A trading fee paid to the exchange" },
          { he: "חלוקת רווחים לבעלי המניות", en: "A distribution of profits to shareholders" },
          { he: "מס על רווחי הון", en: "A tax on capital gains" },
          { he: "הנחה על רכישת מניות נוספות", en: "A discount on purchasing additional shares" },
        ],
        correct: 1,
        explanation: {
          he: "דיבידנד הוא חלוקת רווחים לבעלי המניות. חברות רווחיות רבות מחלקות חלק מהרווחים כדיבידנד.",
          en: "A dividend is a distribution of profits to shareholders. Many profitable companies pay out a portion of their earnings as dividends.",
        },
      },
    ],
  },

  {
    lessonId: "reading-charts",
    questions: [
      {
        question: {
          he: "מה מייצג גוף הנר (בנר יפני)?",
          en: "What does the candle body represent in a candlestick chart?",
        },
        options: [
          { he: "את מחיר הפתיחה בלבד", en: "Only the opening price" },
          { he: "את מחיר הסגירה בלבד", en: "Only the closing price" },
          { he: "את הטווח בין מחיר הפתיחה לסגירה", en: "The range between opening and closing price" },
          { he: "את נפח המסחר היומי", en: "The daily trading volume" },
        ],
        correct: 2,
        explanation: {
          he: "גוף הנר מייצג את הטווח בין מחיר הפתיחה למחיר הסגירה. נר ירוק — הסגירה גבוהה מהפתיחה. נר אדום — ההיפך.",
          en: "The candle body represents the range between opening and closing price. A green candle means the close was higher than the open. A red candle means the opposite.",
        },
      },
      {
        question: {
          he: "מה מייצגים ה'פתילים' (הצללים) של הנר?",
          en: "What do the 'wicks' (shadows) of a candlestick represent?",
        },
        options: [
          { he: "את מחיר הפתיחה והסגירה", en: "The opening and closing prices" },
          { he: "את המחירים הגבוה והנמוך ביותר בפרק הזמן", en: "The highest and lowest prices during the period" },
          { he: "את נפח המסחר", en: "The trading volume" },
          { he: "את שינוי האחוזי", en: "The percentage change" },
        ],
        correct: 1,
        explanation: {
          he: "הפתילים מראים את המחיר הגבוה ביותר והנמוך ביותר שנגע בהם הנייר ערך בפרק הזמן הנבחר.",
          en: "The wicks show the highest and lowest prices the security touched during the selected time period.",
        },
      },
      {
        question: {
          he: "מה מאפיין מגמת עלייה (Uptrend) בגרף?",
          en: "What characterizes an uptrend on a chart?",
        },
        options: [
          { he: "שיאים גבוהים יותר ושפלים גבוהים יותר ברצף", en: "Successive higher highs and higher lows" },
          { he: "מחיר קבוע לאורך זמן", en: "A flat price over time" },
          { he: "שיאים נמוכים יותר ושפלים נמוכים יותר", en: "Successive lower highs and lower lows" },
          { he: "תנודות אקראיות ללא כיוון", en: "Random fluctuations with no direction" },
        ],
        correct: 0,
        explanation: {
          he: "מגמת עלייה מאופיינת בשיאים גבוהים יותר ושפלים גבוהים יותר — כלומר הגרף 'עולה מדרגות' כלפי מעלה.",
          en: "An uptrend is characterized by higher highs and higher lows — the chart forms a 'staircase' pattern going upward.",
        },
      },
      {
        question: {
          he: "מהי ממוצע נע (Moving Average)?",
          en: "What is a moving average?",
        },
        options: [
          { he: "המחיר הגבוה ביותר ב-52 השבועות האחרונים", en: "The highest price in the last 52 weeks" },
          { he: "ממוצע מחירי הסגירה על פני פרק זמן מסוים", en: "The average of closing prices over a certain time period" },
          { he: "נפח המסחר הממוצע ביום", en: "The average daily trading volume" },
          { he: "ההפרש בין מחיר קנייה למכירה", en: "The difference between buy and sell price" },
        ],
        correct: 1,
        explanation: {
          he: "ממוצע נע מחשב את הממוצע של מחירי הסגירה על פני תקופה (למשל 50 יום). הוא מחליק תנודות ומראה את המגמה הכללית.",
          en: "A moving average calculates the average of closing prices over a period (e.g. 50 days). It smooths out fluctuations and shows the overall trend.",
        },
      },
    ],
  },

  {
    lessonId: "pe-ratio",
    questions: [
      {
        question: {
          he: "מה מייצג יחס מחיר לרווח (P/E)?",
          en: "What does the Price-to-Earnings (P/E) ratio represent?",
        },
        options: [
          { he: "כמה שנים לוקח לחברה להחזיר את ההשקעה ברווחים שנתיים", en: "How many years it takes for the company to recoup the investment through annual earnings" },
          { he: "האחוז שהחברה מחלקת כדיבידנד", en: "The percentage the company pays as dividend" },
          { he: "יחס ההון לחוב של החברה", en: "The company's equity-to-debt ratio" },
          { he: "שיעור הצמיחה הצפוי של ההכנסות", en: "The expected revenue growth rate" },
        ],
        correct: 0,
        explanation: {
          he: "P/E = מחיר המניה / רווח למניה. הוא מייצג כמה שנים של רווח שוטף נדרשות כדי להחזיר את מחיר הקנייה.",
          en: "P/E = stock price / earnings per share. It represents how many years of current earnings are needed to recoup the purchase price.",
        },
      },
      {
        question: {
          he: "חברה נסחרת ב-100 ₪ למניה ורווחה השנתי למניה הוא 5 ₪. מהו ה-P/E?",
          en: "A company trades at ₪100 per share with annual earnings of ₪5 per share. What is the P/E?",
        },
        options: [
          { he: "5", en: "5" },
          { he: "10", en: "10" },
          { he: "20", en: "20" },
          { he: "500", en: "500" },
        ],
        correct: 2,
        explanation: {
          he: "P/E = 100 ÷ 5 = 20. כלומר המשקיע משלם 20 שנות רווח עבור המניה.",
          en: "P/E = 100 ÷ 5 = 20. This means the investor is paying 20 years' worth of earnings for the stock.",
        },
      },
      {
        question: {
          he: "P/E גבוה מאוד בדרך כלל מעיד על מה?",
          en: "A very high P/E ratio usually indicates what?",
        },
        options: [
          { he: "החברה זולה מאוד", en: "The company is very cheap" },
          { he: "השוק מצפה לצמיחה גבוהה בעתיד", en: "The market expects high future growth" },
          { he: "החברה לא מרוויחה כלום", en: "The company is earning nothing" },
          { he: "המניה עומדת לצנוח", en: "The stock is about to crash" },
        ],
        correct: 1,
        explanation: {
          he: "P/E גבוה מעיד שהשוק מצפה לצמיחה עתידית גדולה. משקיעים מוכנים לשלם 'פרמיה' על ציפיות לרווחים גבוהים יותר בעתיד.",
          en: "A high P/E suggests the market expects significant future growth. Investors are willing to pay a 'premium' based on expectations of higher future earnings.",
        },
      },
      {
        question: {
          he: "איזה מהבאים הוא שימוש נכון ב-P/E?",
          en: "Which of the following is a correct use of P/E?",
        },
        options: [
          { he: "להשוות מניות בין ענפים שונים", en: "Comparing stocks across completely different industries" },
          { he: "להשוות מניות באותו ענף זו לזו", en: "Comparing stocks within the same industry" },
          { he: "לחשב את הדיבידנד הצפוי", en: "To calculate the expected dividend" },
          { he: "לחזות את מחיר המניה בשנה הבאה", en: "To predict the stock price next year" },
        ],
        correct: 1,
        explanation: {
          he: "P/E הכי שימושי כשמשווים חברות דומות באותו ענף. השוואה בין ענפים שונים עלולה להטעות.",
          en: "P/E is most useful when comparing similar companies within the same industry. Cross-industry comparisons can be misleading.",
        },
      },
    ],
  },

  {
    lessonId: "diversification",
    questions: [
      {
        question: {
          he: "מהי פיזור השקעות (Diversification)?",
          en: "What is investment diversification?",
        },
        options: [
          { he: "השקעת כל הכסף במניה אחת מבטיחה", en: "Investing all money in one promising stock" },
          { he: "פיצול ההשקעה בין נכסים ושוקים שונים", en: "Splitting the investment across different assets and markets" },
          { he: "השקעה רק במניות שעלו בשנה האחרונה", en: "Investing only in stocks that rose last year" },
          { he: "שמירת כל הכסף במזומן", en: "Keeping all money in cash" },
        ],
        correct: 1,
        explanation: {
          he: "פיזור הוא פיצול ההשקעה בין נכסים שונים כדי להפחית סיכון — אם נכס אחד יורד, האחרים יכולים לפצות.",
          en: "Diversification means spreading investments across different assets to reduce risk — if one asset drops, others can compensate.",
        },
      },
      {
        question: {
          he: "איזה פורטפוליו מפוזר יותר?",
          en: "Which portfolio is more diversified?",
        },
        options: [
          { he: "10 מניות טכנולוגיה אמריקאיות", en: "10 American technology stocks" },
          { he: "מניות, אגרות חוב, נדל\"ן ומניות בינלאומיות", en: "Stocks, bonds, real estate, and international equities" },
          { he: "5 מניות בנקאות בלבד", en: "5 banking stocks only" },
          { he: "מניה אחת עם ביצועים היסטוריים טובים", en: "One stock with good historical performance" },
        ],
        correct: 1,
        explanation: {
          he: "פורטפוליו מפוזר כולל נכסים מסוגים שונים ומגיאוגרפיות שונות. מניות טכנולוגיה בלבד — גם אם יש הרבה — הן עדיין נתונות לאותו סיכון ענפי.",
          en: "A diversified portfolio includes different asset types and geographies. Technology stocks alone — even many of them — still carry the same sector risk.",
        },
      },
      {
        question: {
          he: "מה ההיגיון מאחורי הביטוי 'אל תשים את כל הביצים בסל אחד'?",
          en: "What is the logic behind 'don't put all your eggs in one basket'?",
        },
        options: [
          { he: "כדאי לפזר סיכון כך שכשל של נכס אחד לא ימחק את כל ההשקעה", en: "Spreading risk so that the failure of one asset doesn't wipe out the entire investment" },
          { he: "צריך לקנות מניות רק בבורסות שונות", en: "You should only buy stocks on different exchanges" },
          { he: "עדיף להחזיק הרבה מניות זולות על פני מעט יקרות", en: "It's better to hold many cheap stocks than a few expensive ones" },
          { he: "כדאי לפזר את הקניות לאורך זמן רב", en: "It's better to spread purchases over a long time" },
        ],
        correct: 0,
        explanation: {
          he: "הרעיון הוא פיזור סיכון. אם כל הכסף במניה אחת והיא קורסת — הפסדת הכל. פיזור מגן מפני כשל בודד.",
          en: "The idea is risk spreading. If all your money is in one stock and it collapses — you lose everything. Diversification protects against a single failure.",
        },
      },
      {
        question: {
          he: "מהו 'קורלציה' בהקשר של פיזור השקעות?",
          en: "What is 'correlation' in the context of investment diversification?",
        },
        options: [
          { he: "הרווח הממוצע של הפורטפוליו", en: "The average return of the portfolio" },
          { he: "המידה שבה שני נכסים נעים יחד", en: "The degree to which two assets move together" },
          { he: "יחס החוב להון בפורטפוליו", en: "The debt-to-equity ratio in the portfolio" },
          { he: "מספר המניות בפורטפוליו", en: "The number of stocks in the portfolio" },
        ],
        correct: 1,
        explanation: {
          he: "קורלציה מודדת כמה שני נכסים נעים באותו כיוון. לפיזור אמיתי כדאי לשלב נכסים עם קורלציה נמוכה ביניהם.",
          en: "Correlation measures how much two assets move in the same direction. For real diversification, combine assets with low correlation to each other.",
        },
      },
    ],
  },

  {
    lessonId: "risk-vs-return",
    questions: [
      {
        question: {
          he: "מה הקשר בין סיכון לתשואה פוטנציאלית?",
          en: "What is the relationship between risk and potential return?",
        },
        options: [
          { he: "ככל שהסיכון גבוה יותר, התשואה הפוטנציאלית נמוכה יותר", en: "Higher risk leads to lower potential return" },
          { he: "אין קשר בין סיכון לתשואה", en: "There is no relationship between risk and return" },
          { he: "ככל שהסיכון גבוה יותר, התשואה הפוטנציאלית גבוהה יותר", en: "Higher risk leads to higher potential return" },
          { he: "סיכון גבוה מבטיח תשואה גבוהה", en: "High risk guarantees high return" },
        ],
        correct: 2,
        explanation: {
          he: "בפיננסים: סיכון ותשואה פוטנציאלית נעים יחד. השקעה מסוכנת יותר מציעה פוטנציאל לתשואה גבוהה יותר — אך גם להפסד גדול יותר.",
          en: "In finance: risk and potential return move together. A riskier investment offers the potential for higher returns — but also greater losses.",
        },
      },
      {
        question: {
          he: "איזו השקעה נחשבת לסיכון נמוך ביותר בדרך כלל?",
          en: "Which investment is generally considered the lowest risk?",
        },
        options: [
          { he: "מניות של חברות סטארטאפ", en: "Startup company stocks" },
          { he: "אגרות חוב ממשלתיות", en: "Government bonds" },
          { he: "מטבעות קריפטוגרפיים", en: "Cryptocurrencies" },
          { he: "מניות של חברה אחת בלבד", en: "Stocks of a single company" },
        ],
        correct: 1,
        explanation: {
          he: "אגרות חוב ממשלתיות נחשבות להשקעה בסיכון נמוך מאוד כיוון שהממשלה מבטיחה את הפירעון. בתמורה, התשואה נמוכה יחסית.",
          en: "Government bonds are considered very low risk because the government guarantees repayment. In return, the yield is relatively low.",
        },
      },
      {
        question: {
          he: "מהו 'סיכון שוק' (Market Risk)?",
          en: "What is 'market risk'?",
        },
        options: [
          { he: "סיכון שנובע ממחדל של חברה ספציפית", en: "Risk arising from a specific company's default" },
          { he: "סיכון שנובע מתנודות השוק הכללי שאי אפשר לגוון ממנו", en: "Risk from general market fluctuations that cannot be diversified away" },
          { he: "הסיכון שמחיר הדולר ישתנה", en: "The risk that the dollar price will change" },
          { he: "הסיכון שהמסחר ייפסק", en: "The risk that trading will stop" },
        ],
        correct: 1,
        explanation: {
          he: "סיכון שוק הוא הסיכון שכלל השוק יירד — כמו במשברים כלכליים. לא ניתן לגוון ממנו לחלוטין כי הוא משפיע על כל הנכסים.",
          en: "Market risk is the risk that the entire market will decline — as in economic crises. It cannot be fully diversified away because it affects all assets.",
        },
      },
      {
        question: {
          he: "משקיע צעיר עם אופק של 30 שנה — איזו גישה בדרך כלל מתאימה לו?",
          en: "A young investor with a 30-year horizon — which approach usually suits them?",
        },
        options: [
          { he: "השקעה שמרנית מאוד עם סיכון מינימלי", en: "Very conservative investment with minimal risk" },
          { he: "שמירת הכל במזומן", en: "Keeping everything in cash" },
          { he: "נכונות לקחת יותר סיכון לטובת תשואות גבוהות לאורך זמן", en: "Willingness to take more risk for higher long-term returns" },
          { he: "השקעה רק באגרות חוב לטווח קצר", en: "Investing only in short-term bonds" },
        ],
        correct: 2,
        explanation: {
          he: "אופק השקעה ארוך מאפשר לספוג ירידות שוק ולהחלים מהן. לכן משקיעים צעירים יכולים בדרך כלל לקחת יותר סיכון.",
          en: "A long investment horizon allows absorbing market downturns and recovering from them. This is why younger investors can generally take on more risk.",
        },
      },
    ],
  },

  {
    lessonId: "etf-vs-stock",
    questions: [
      {
        question: {
          he: "מה זה ETF?",
          en: "What is an ETF?",
        },
        options: [
          { he: "מניה של חברת טכנולוגיה", en: "A technology company stock" },
          { he: "קרן סל הנסחרת בבורסה המחקה מדד או ענף", en: "An exchange-traded fund that tracks an index or sector" },
          { he: "אגרת חוב ממשלתית", en: "A government bond" },
          { he: "חשבון חיסכון בנקאי", en: "A bank savings account" },
        ],
        correct: 1,
        explanation: {
          he: "ETF (קרן סל) היא מכשיר השקעה הנסחר בבורסה כמו מניה, אך מחזיק בפנים קבוצה של נכסים — למשל מניות כל חברות ה-S&P 500.",
          en: "An ETF (Exchange-Traded Fund) trades on exchanges like a stock but holds a collection of assets inside — for example, all S&P 500 companies.",
        },
      },
      {
        question: {
          he: "מה יתרון עיקרי של ETF על פני מניה בודדת?",
          en: "What is a key advantage of an ETF over a single stock?",
        },
        options: [
          { he: "ETF תמיד עולה בערכו", en: "ETFs always go up in value" },
          { he: "ETF מספק פיזור מיידי עם השקעה אחת", en: "ETF provides instant diversification with one investment" },
          { he: "ETF פטור ממס", en: "ETFs are tax-exempt" },
          { he: "ETF מציע תשואה גבוהה יותר תמיד", en: "ETFs always offer higher returns" },
        ],
        correct: 1,
        explanation: {
          he: "ETF מאפשר לרכוש בהשקעה אחת חשיפה לעשרות ואף מאות חברות — פיזור מיידי ללא צורך לבחור מניות בנפרד.",
          en: "An ETF lets you buy exposure to dozens or even hundreds of companies in a single investment — instant diversification without picking individual stocks.",
        },
      },
      {
        question: {
          he: "מה חיסרון אפשרי של ETF לעומת מניה בודדת?",
          en: "What is a possible disadvantage of an ETF compared to a single stock?",
        },
        options: [
          { he: "ETF קשה יותר לקנות ולמכור", en: "ETFs are harder to buy and sell" },
          { he: "אין אפשרות להרוויח יותר מהמדד שהוא עוקב אחריו", en: "No ability to outperform the index it tracks" },
          { he: "ETF לא מחלק דיבידנד", en: "ETFs don't pay dividends" },
          { he: "ETF דורש ניהול אקטיבי יקר", en: "ETFs require expensive active management" },
        ],
        correct: 1,
        explanation: {
          he: "ETF שעוקב אחרי מדד לא יכול לנצח את המדד — הוא עוקב אחריו. מניה בודדת שנבחרה נכון יכולה להניב תשואה גבוהה בהרבה מהמדד.",
          en: "An ETF tracking an index cannot beat the index — it follows it. A well-chosen individual stock can deliver much higher returns than the index.",
        },
      },
      {
        question: {
          he: "ETF על מדד S&P 500 מה מייצג?",
          en: "What does an S&P 500 index ETF represent?",
        },
        options: [
          { he: "500 האג\"ח הגדולות בארה\"ב", en: "The 500 largest US bonds" },
          { he: "500 החברות הציבוריות הגדולות בארה\"ב", en: "The 500 largest publicly traded US companies" },
          { he: "500 מניות טכנולוגיה אמריקאיות", en: "500 American technology stocks" },
          { he: "500 קרנות נאמנות", en: "500 mutual funds" },
        ],
        correct: 1,
        explanation: {
          he: "ה-S&P 500 הוא מדד שעוקב אחרי 500 החברות הציבוריות הגדולות ביותר בארה\"ב לפי שווי שוק.",
          en: "The S&P 500 is an index tracking the 500 largest publicly traded US companies by market capitalization.",
        },
      },
    ],
  },

  {
    lessonId: "market-orders",
    questions: [
      {
        question: {
          he: "מה ההבדל בין פקודת שוק (Market Order) לפקודת לימיט (Limit Order)?",
          en: "What is the difference between a Market Order and a Limit Order?",
        },
        options: [
          { he: "פקודת שוק מוזלת יותר", en: "A market order is cheaper" },
          { he: "פקודת שוק מבוצעת מיד במחיר השוק הנוכחי; לימיט מוגדר מחיר מקסימלי/מינימלי", en: "A market order executes immediately at current market price; a limit order sets a max/min price" },
          { he: "פקודת לימיט מבוצעת מהר יותר", en: "A limit order executes faster" },
          { he: "אין הבדל מעשי ביניהם", en: "There is no practical difference between them" },
        ],
        correct: 1,
        explanation: {
          he: "פקודת שוק מבוצעת מיד בכל מחיר זמין. פקודת לימיט מבוצעת רק אם המחיר מגיע לרמה שקבעת — נותנת שליטה על המחיר.",
          en: "A market order executes immediately at any available price. A limit order only executes if the price reaches your set level — giving you price control.",
        },
      },
      {
        question: {
          he: "מהי פקודת Stop Loss?",
          en: "What is a Stop Loss order?",
        },
        options: [
          { he: "פקודה לקנות עוד מניות כשהמחיר יורד", en: "An order to buy more shares when the price drops" },
          { he: "פקודה אוטומטית למכירה אם המחיר יורד מתחת לסף מוגדר", en: "An automatic sell order if the price falls below a defined threshold" },
          { he: "פקודה לעצור את המסחר בחשבון", en: "An order to stop all trading in the account" },
          { he: "פקודה לרכישה בלחיצה אחת", en: "A one-click purchase order" },
        ],
        correct: 1,
        explanation: {
          he: "Stop Loss היא פקודה אוטומטית שמגנה מהפסד גדול. אם המחיר יורד מתחת לסף שקבעת — המניה נמכרת אוטומטית.",
          en: "A Stop Loss is an automatic order that protects against large losses. If the price falls below your set threshold — the stock is automatically sold.",
        },
      },
      {
        question: {
          he: "קנית מניה ב-100 ₪. שמת Stop Loss ב-90 ₪. מה יקרה אם המחיר ירד ל-88 ₪?",
          en: "You bought a stock at ₪100. You set a Stop Loss at ₪90. What happens if the price drops to ₪88?",
        },
        options: [
          { he: "כלום, צריך לאשר ידנית", en: "Nothing, you need to confirm manually" },
          { he: "המניה תימכר אוטומטית בסביבות 90 ₪", en: "The stock is automatically sold around ₪90" },
          { he: "תקבל התראה בלבד", en: "You only receive an alert" },
          { he: "הפקודה תבוטל", en: "The order is cancelled" },
        ],
        correct: 1,
        explanation: {
          he: "כשהמחיר עבר את רמת ה-Stop Loss (90 ₪), הפקודה מופעלת ומניה נמכרת — מגבילה את ההפסד המקסימלי לכ-10%.",
          en: "When the price crossed the Stop Loss level (₪90), the order triggers and the stock is sold — limiting the maximum loss to about 10%.",
        },
      },
      {
        question: {
          he: "מתי עדיף להשתמש בפקודת לימיט על פני פקודת שוק?",
          en: "When is it preferable to use a limit order over a market order?",
        },
        options: [
          { he: "כשרוצים לבצע עסקה מהירה בכל מחיר", en: "When you want to execute a trade quickly at any price" },
          { he: "כשרוצים שליטה על מחיר הקנייה ולא ממהרים", en: "When you want price control and are not in a hurry" },
          { he: "כשהשוק סגור", en: "When the market is closed" },
          { he: "רק בזמן דיווח רווחים", en: "Only during earnings reports" },
        ],
        correct: 1,
        explanation: {
          he: "פקודת לימיט עדיפה כשיש לך מחיר יעד ואינך ממהר. היא מבטיחה שלא תשלם יותר (בקנייה) או תקבל פחות (במכירה) ממחיר שקבעת.",
          en: "A limit order is preferable when you have a target price and are not in a hurry. It ensures you won't pay more (when buying) or receive less (when selling) than your set price.",
        },
      },
    ],
  },

  {
    lessonId: "bulls-bears",
    questions: [
      {
        question: {
          he: "מהו שוק שורי (Bull Market)?",
          en: "What is a bull market?",
        },
        options: [
          { he: "שוק שבו מניות יורדות ב-20% ומעלה", en: "A market where stocks fall 20% or more" },
          { he: "שוק שבו מניות עולות ב-20% ומעלה לאורך זמן", en: "A market where stocks rise 20% or more over time" },
          { he: "שוק שמסחר בו נעצר", en: "A market where trading has stopped" },
          { he: "שוק שפועל רק בשעות מסוימות", en: "A market that operates only during specific hours" },
        ],
        correct: 1,
        explanation: {
          he: "שוק שורי מוגדר כעלייה של 20% ומעלה ממינימום אחרון. הוא מאופיין באופטימיות, צמיחה כלכלית ועליות נרחבות.",
          en: "A bull market is defined as a rise of 20% or more from a recent low. It's characterized by optimism, economic growth, and broad price increases.",
        },
      },
      {
        question: {
          he: "מהו שוק דובי (Bear Market)?",
          en: "What is a bear market?",
        },
        options: [
          { he: "שוק שבו מניות עולות ב-20% ומעלה", en: "A market where stocks rise 20% or more" },
          { he: "שוק שבו יש יותר קונים ממוכרים", en: "A market where there are more buyers than sellers" },
          { he: "שוק שבו מניות יורדות ב-20% ומעלה ממקסימום אחרון", en: "A market where stocks fall 20% or more from a recent peak" },
          { he: "שוק שנמצא בתנודתיות גבוהה", en: "A market with high volatility" },
        ],
        correct: 2,
        explanation: {
          he: "שוק דובי מוגדר כירידה של 20% ומעלה ממקסימום אחרון. הוא מאופיין בפסימיות, האטה כלכלית וירידות נרחבות.",
          en: "A bear market is defined as a drop of 20% or more from a recent peak. It's characterized by pessimism, economic slowdown, and broad price declines.",
        },
      },
      {
        question: {
          he: "מדוע בורים ושוורים נבחרו כסמלים לשווקים?",
          en: "Why were bulls and bears chosen as market symbols?",
        },
        options: [
          { he: "כי שני החיות מופיעות על שטרות כסף", en: "Because both animals appear on currency notes" },
          { he: "כי השור דוחף קרניו למעלה ואילו הדוב מטיל מכה כלפי מטה", en: "Because a bull thrusts its horns upward while a bear swipes its paw downward" },
          { he: "כי שני החיות חיות בוול סטריט", en: "Because both animals live on Wall Street" },
          { he: "כי שתיהן חיות חזקות", en: "Because both are strong animals" },
        ],
        correct: 1,
        explanation: {
          he: "המטפורה מגיעה מתנועת ההתקפה: השור דוחף קרניו כלפי מעלה (עלייה), והדוב מטיל מכת טלפיים כלפי מטה (ירידה).",
          en: "The metaphor comes from attack movements: a bull thrusts its horns upward (rising), while a bear swipes its paw downward (falling).",
        },
      },
      {
        question: {
          he: "אסטרטגיה נפוצה בשוק דובי היא?",
          en: "A common strategy in a bear market is?",
        },
        options: [
          { he: "מכירת הכל ומעבר למזומן", en: "Selling everything and moving to cash" },
          { he: "רכישה מוגברת של מניות מסוכנות", en: "Buying more risky stocks aggressively" },
          { he: "המשך השקעה שיטתית ורכישה בהנחה (DCA)", en: "Continuing systematic investment and buying at a discount (DCA)" },
          { he: "השקעה בסחורות בלבד", en: "Investing only in commodities" },
        ],
        correct: 2,
        explanation: {
          he: "משקיעים לטווח ארוך מנצלים שוק דובי לרכישת מניות בהנחה. DCA (השקעה סדירה) מאפשר לקנות יותר יחידות במחיר נמוך.",
          en: "Long-term investors use bear markets to buy stocks at a discount. DCA (regular investing) allows buying more units at a lower price.",
        },
      },
    ],
  },

  {
    lessonId: "dividends",
    questions: [
      {
        question: {
          he: "מתי חברה בדרך כלל מחלקת דיבידנד?",
          en: "When does a company typically pay a dividend?",
        },
        options: [
          { he: "כשהמניה שלה מגיעה לשיא חדש", en: "When its stock reaches a new high" },
          { he: "כשהיא מרוויחה מספיק ורוצה לחלק רווחים לבעלי המניות", en: "When it earns enough and wants to share profits with shareholders" },
          { he: "רק כשהיא מנפיקה מניות חדשות", en: "Only when it issues new shares" },
          { he: "כשהמניה שלה יורדת", en: "When its stock is falling" },
        ],
        correct: 1,
        explanation: {
          he: "חברות מחלקות דיבידנד כשיש להן רווחים עודפים ורוצות לתגמל את בעלי המניות. חברות צמיחה לרוב מעדיפות להשקיע מחדש.",
          en: "Companies pay dividends when they have surplus earnings and want to reward shareholders. Growth companies often prefer to reinvest instead.",
        },
      },
      {
        question: {
          he: "מהו 'תשואת הדיבידנד' (Dividend Yield)?",
          en: "What is 'Dividend Yield'?",
        },
        options: [
          { he: "הסכום הכולל ששולם כדיבידנד בשנה", en: "The total amount paid as dividends in a year" },
          { he: "דיבידנד שנתי חלקי מחיר המניה, באחוזים", en: "Annual dividend divided by stock price, as a percentage" },
          { he: "הרווח הנקי של החברה", en: "The company's net profit" },
          { he: "יחס הדיבידנד לרווח למניה", en: "The ratio of dividend to earnings per share" },
        ],
        correct: 1,
        explanation: {
          he: "תשואת הדיבידנד = דיבידנד שנתי / מחיר מניה × 100. למשל: דיבידנד 4 ₪, מניה ב-100 ₪ — תשואת דיבידנד 4%.",
          en: "Dividend Yield = Annual Dividend / Stock Price × 100. For example: ₪4 dividend, stock at ₪100 — 4% dividend yield.",
        },
      },
      {
        question: {
          he: "מהי 'תאריך אקס-דיבידנד' (Ex-Dividend Date)?",
          en: "What is the 'Ex-Dividend Date'?",
        },
        options: [
          { he: "התאריך שבו משולם הדיבידנד בפועל", en: "The date the dividend is actually paid" },
          { he: "התאריך שלפניו צריך להחזיק במניה כדי לקבל את הדיבידנד", en: "The date before which you must hold the stock to receive the dividend" },
          { he: "תאריך הכרזת הדיבידנד", en: "The date the dividend is announced" },
          { he: "תאריך ביטול הדיבידנד", en: "The date the dividend is cancelled" },
        ],
        correct: 1,
        explanation: {
          he: "מי שמחזיק במניה לפני תאריך האקס-דיבידנד זכאי לקבל את הדיבידנד. מי שקנה ביום האקס-דיבידנד או אחריו — לא יקבל.",
          en: "Whoever holds the stock before the ex-dividend date is entitled to receive the dividend. Anyone who bought on or after the ex-dividend date will not receive it.",
        },
      },
      {
        question: {
          he: "מה היתרון של השקעה מחדש של דיבידנדים (DRIP)?",
          en: "What is the benefit of reinvesting dividends (DRIP)?",
        },
        options: [
          { he: "חיסכון בעמלות מסחר", en: "Saving on trading commissions" },
          { he: "ריבית דריבית — הדיבידנדים קונים עוד מניות שמייצרות עוד דיבידנדים", en: "Compound interest — dividends buy more shares that generate more dividends" },
          { he: "פטור ממס על הדיבידנד", en: "Tax exemption on the dividend" },
          { he: "ביטוח מפני ירידת ערך המניה", en: "Insurance against stock price decline" },
        ],
        correct: 1,
        explanation: {
          he: "השקעה מחדש של דיבידנדים יוצרת אפקט של ריבית דריבית: הדיבידנד קונה מניות נוספות, שמייצרות דיבידנד גדול יותר בפעם הבאה.",
          en: "Reinvesting dividends creates a compound effect: the dividend buys more shares, which generate a larger dividend next time.",
        },
      },
    ],
  },

  {
    lessonId: "market-cap",
    questions: [
      {
        question: {
          he: "כיצד מחשבים שווי שוק (Market Cap) של חברה?",
          en: "How is a company's market capitalization calculated?",
        },
        options: [
          { he: "הכנסות שנתיות × 10", en: "Annual revenue × 10" },
          { he: "מחיר המניה × מספר המניות הכולל", en: "Stock price × total number of shares" },
          { he: "שווי הנכסים הכולל של החברה", en: "Total value of the company's assets" },
          { he: "הרווח השנתי × מספר שנות פעילות", en: "Annual profit × years of operation" },
        ],
        correct: 1,
        explanation: {
          he: "שווי שוק = מחיר מניה × מספר מניות. אם מניה עולה 50 ₪ ויש 1 מיליון מניות — שווי השוק הוא 50 מיליון ₪.",
          en: "Market Cap = stock price × number of shares. If a stock is at ₪50 and there are 1 million shares — market cap is ₪50 million.",
        },
      },
      {
        question: {
          he: "חברת Large-Cap היא בדרך כלל?",
          en: "A Large-Cap company typically has a market cap of?",
        },
        options: [
          { he: "מתחת ל-2 מיליארד דולר", en: "Below $2 billion" },
          { he: "בין 2 ל-10 מיליארד דולר", en: "Between $2 and $10 billion" },
          { he: "מעל 10 מיליארד דולר", en: "Above $10 billion" },
          { he: "מעל טריליון דולר בלבד", en: "Above $1 trillion only" },
        ],
        correct: 2,
        explanation: {
          he: "Large-Cap מוגדר בדרך כלל כשווי שוק מעל 10 מיליארד דולר. Small-Cap הוא מתחת ל-2 מיליארד, Mid-Cap ביניהם.",
          en: "Large-Cap is generally defined as a market cap above $10 billion. Small-Cap is below $2 billion, and Mid-Cap is in between.",
        },
      },
      {
        question: {
          he: "מה היתרון של מניות Large-Cap לעומת Small-Cap?",
          en: "What is an advantage of Large-Cap stocks versus Small-Cap?",
        },
        options: [
          { he: "פוטנציאל צמיחה גבוה יותר", en: "Higher growth potential" },
          { he: "תנודתיות גבוהה יותר", en: "Higher volatility" },
          { he: "יציבות גבוהה יותר וסיכון נמוך יותר", en: "Greater stability and lower risk" },
          { he: "תמיד יותר זולות לרכישה", en: "Always cheaper to purchase" },
        ],
        correct: 2,
        explanation: {
          he: "Large-Cap בדרך כלל יציבות יותר ופחות תנודתיות. Small-Cap עשויות לצמוח מהר יותר אך הסיכון גדול יותר.",
          en: "Large-Cap companies are generally more stable and less volatile. Small-Cap may grow faster but carry greater risk.",
        },
      },
      {
        question: {
          he: "האם שווי שוק גבוה אומר שהמניה יקרה מדי?",
          en: "Does a high market cap mean the stock is overpriced?",
        },
        options: [
          { he: "כן, תמיד", en: "Yes, always" },
          { he: "לא בהכרח — שווי שוק לא מודד את הערך הפנימי", en: "Not necessarily — market cap doesn't measure intrinsic value" },
          { he: "כן, חברות גדולות תמיד יקרות מדי", en: "Yes, large companies are always overpriced" },
          { he: "לא, חברות גדולות תמיד זולות", en: "No, large companies are always cheap" },
        ],
        correct: 1,
        explanation: {
          he: "שווי שוק גבוה משקף את גודל החברה, לא בהכרח את הערך הפנימי. יש להשתמש ביחסים כמו P/E ו-P/S להערכת יוקר.",
          en: "High market cap reflects company size, not necessarily intrinsic value. Use ratios like P/E and P/S to assess valuation.",
        },
      },
    ],
  },

  {
    lessonId: "inflation",
    questions: [
      {
        question: {
          he: "כיצד אינפלציה משפיעה על כסף שנשמר במזומן?",
          en: "How does inflation affect money kept as cash?",
        },
        options: [
          { he: "הכסף שומר על ערכו", en: "The money retains its value" },
          { he: "הכסף מרוויח ריבית אוטומטית", en: "The money earns interest automatically" },
          { he: "הכסף מאבד כוח קנייה לאורך זמן", en: "The money loses purchasing power over time" },
          { he: "ערך הכסף עולה", en: "The value of money rises" },
        ],
        correct: 2,
        explanation: {
          he: "אינפלציה שוחקת את ערך הכסף — 100 ₪ היום יקנו פחות מוצרים בעתיד. לכן חשוב להשקיע ולהכות את האינפלציה.",
          en: "Inflation erodes money's value — ₪100 today will buy fewer goods in the future. This is why it's important to invest and beat inflation.",
        },
      },
      {
        question: {
          he: "מה יחשב כגידור (Hedge) טוב מפני אינפלציה?",
          en: "What would be considered a good inflation hedge?",
        },
        options: [
          { he: "פיקדון בנקאי קצר מועד", en: "Short-term bank deposit" },
          { he: "אחזקת מזומן רב", en: "Holding large amounts of cash" },
          { he: "מניות, נדל\"ן וזהב", en: "Stocks, real estate, and gold" },
          { he: "אגרות חוב קצרות מועד", en: "Short-term bonds" },
        ],
        correct: 2,
        explanation: {
          he: "מניות, נדל\"ן וזהב היסטורית עלו לאורך זמן ועקפו את האינפלציה. נכסים ריאליים שומרים על ערכם טוב יותר ממזומן.",
          en: "Stocks, real estate, and gold have historically risen over time and outpaced inflation. Real assets preserve value better than cash.",
        },
      },
      {
        question: {
          he: "אם האינפלציה היא 5% בשנה ותיק ההשקעות הניב 3% — מה קרה בפועל?",
          en: "If inflation is 5% per year and your portfolio returned 3% — what actually happened?",
        },
        options: [
          { he: "הרווחת 3%", en: "You earned 3%" },
          { he: "הרווחת 8%", en: "You earned 8%" },
          { he: "הפסדת 2% בכוח קנייה ריאלי", en: "You lost 2% in real purchasing power" },
          { he: "ניצחת את האינפלציה", en: "You beat inflation" },
        ],
        correct: 2,
        explanation: {
          he: "תשואה ריאלית = תשואה נומינלית פחות אינפלציה. 3% − 5% = −2%. כלומר בפועל כוח הקנייה שלך ירד.",
          en: "Real return = nominal return minus inflation. 3% − 5% = −2%. In practice, your purchasing power actually declined.",
        },
      },
      {
        question: {
          he: "בנק מרכזי בדרך כלל מעלה ריבית כדי?",
          en: "A central bank typically raises interest rates in order to?",
        },
        options: [
          { he: "לעודד השקעות בשוק המניות", en: "Encourage stock market investment" },
          { he: "להאיץ את הצמיחה הכלכלית", en: "Accelerate economic growth" },
          { he: "להאט את האינפלציה", en: "Slow down inflation" },
          { he: "להוריד את שיעור האבטלה", en: "Reduce unemployment" },
        ],
        correct: 2,
        explanation: {
          he: "העלאת ריבית מייקרת את האשראי ומקטינה את הביקוש — מה שמאט את האינפלציה. זהו הכלי העיקרי של בנקים מרכזיים.",
          en: "Raising rates makes credit more expensive and reduces demand — which slows inflation. This is the primary tool of central banks.",
        },
      },
    ],
  },

  {
    lessonId: "compound-interest",
    questions: [
      {
        question: {
          he: "מהי ריבית דריבית?",
          en: "What is compound interest?",
        },
        options: [
          { he: "ריבית על הקרן בלבד", en: "Interest on the principal only" },
          { he: "ריבית שמחושבת על הקרן ועל הריבית שנצברה", en: "Interest calculated on both the principal and the accumulated interest" },
          { he: "ריבית שמשתנה עם הזמן", en: "Interest that changes over time" },
          { he: "ריבית ממשלתית קבועה", en: "A fixed government interest rate" },
        ],
        correct: 1,
        explanation: {
          he: "ריבית דריבית = ריבית על ריבית. הרווחים מצטרפים לקרן ומייצרים עוד רווחים — זהו הכוח שמאחורי צמיחת הון לאורך זמן.",
          en: "Compound interest = interest on interest. Earnings are added to the principal and generate more earnings — this is the power behind wealth growth over time.",
        },
      },
      {
        question: {
          he: "השקעת 10,000 ₪ עם תשואה שנתית של 10% לאחר שנה אחת (ריבית פשוטה לעומת דריבית — בשנה הראשונה) — כמה יש?",
          en: "You invested ₪10,000 at 10% annual return. After one year — how much do you have?",
        },
        options: [
          { he: "10,100 ₪", en: "₪10,100" },
          { he: "11,000 ₪", en: "₪11,000" },
          { he: "10,010 ₪", en: "₪10,010" },
          { he: "20,000 ₪", en: "₪20,000" },
        ],
        correct: 1,
        explanation: {
          he: "10,000 × 1.10 = 11,000 ₪. הרווח הוא 1,000 ₪ (10% מ-10,000). בשנה הבאה הריבית תחושב על 11,000 ₪.",
          en: "10,000 × 1.10 = ₪11,000. The gain is ₪1,000 (10% of ₪10,000). Next year, interest will be calculated on ₪11,000.",
        },
      },
      {
        question: {
          he: "מהו DCA (Dollar Cost Averaging)?",
          en: "What is DCA (Dollar Cost Averaging)?",
        },
        options: [
          { he: "קנייה של כמות קבועה של מניות מדי חודש", en: "Buying a fixed quantity of stocks every month" },
          { he: "השקעת סכום כסף קבוע מדי תקופה ללא קשר למחיר", en: "Investing a fixed amount of money periodically regardless of price" },
          { he: "מכירת מניות כשמחירן יורד", en: "Selling stocks when their price drops" },
          { he: "רכישת מניות רק בשיאי שוק", en: "Buying stocks only at market peaks" },
        ],
        correct: 1,
        explanation: {
          he: "DCA הוא השקעת סכום קבוע (למשל 500 ₪ בחודש) בכל תקופה. כשהמחיר נמוך קונים יותר יחידות, כשגבוה — פחות. ממצע את עלות הרכישה.",
          en: "DCA means investing a fixed amount (e.g. ₪500/month) every period. When the price is low you buy more units, when high — fewer. This averages out the purchase cost.",
        },
      },
      {
        question: {
          he: "כלל ה-72 בהשקעות אומר מה?",
          en: "The Rule of 72 in investing says what?",
        },
        options: [
          { he: "השוק מכפיל את עצמו כל 72 שנה", en: "The market doubles every 72 years" },
          { he: "72 ÷ שיעור הריבית השנתי = מספר שנים להכפלת ההשקעה", en: "72 ÷ annual interest rate = years to double the investment" },
          { he: "יש להשקיע 72% מהחיסכון בשוק המניות", en: "You should invest 72% of savings in the stock market" },
          { he: "אחרי 72 חודשים כל השקעה מוכפלת", en: "After 72 months every investment doubles" },
        ],
        correct: 1,
        explanation: {
          he: "כלל ה-72: חלק 72 בשיעור הריבית השנתי ותקבל את מספר השנים להכפלת ההשקעה. ריבית 8% → 72÷8 = 9 שנות הכפלה.",
          en: "Rule of 72: divide 72 by the annual interest rate to get the years to double the investment. 8% interest → 72÷8 = 9 years to double.",
        },
      },
    ],
  },

  {
    lessonId: "technical-analysis",
    questions: [
      {
        question: {
          he: "מהי 'רמת תמיכה' (Support) בניתוח טכני?",
          en: "What is a 'support level' in technical analysis?",
        },
        options: [
          { he: "רמת מחיר שבה הביקוש נוטה לעצור את הירידה", en: "A price level where demand tends to stop the decline" },
          { he: "הממוצע הנע של 200 יום", en: "The 200-day moving average" },
          { he: "המחיר הגבוה ביותר בשנה", en: "The highest price of the year" },
          { he: "רמת מחיר שבה ההיצע גובר", en: "A price level where supply dominates" },
        ],
        correct: 0,
        explanation: {
          he: "תמיכה היא רמת מחיר שבה קונים מתעוררים ועוצרים את הירידה. הגרף 'קופץ' ממנה חזרה למעלה שוב ושוב.",
          en: "Support is a price level where buyers emerge and stop the decline. The chart 'bounces' off it repeatedly.",
        },
      },
      {
        question: {
          he: "מהי 'רמת התנגדות' (Resistance) בניתוח טכני?",
          en: "What is a 'resistance level' in technical analysis?",
        },
        options: [
          { he: "רמת מחיר שמתחתיה המניה לא תרד", en: "A price level the stock won't fall below" },
          { he: "רמת מחיר שבה ההיצע גובר ועוצר את העלייה", en: "A price level where supply increases and stops the rise" },
          { he: "נקודת הפסד הרווח המקסימלית", en: "The maximum profit/loss point" },
          { he: "ממוצע המחירים ב-52 שבועות", en: "The average price over 52 weeks" },
        ],
        correct: 1,
        explanation: {
          he: "התנגדות היא רמת מחיר שבה מוכרים נכנסים לשוק ועוצרים את העלייה. הגרף 'נדחה' ממנה חזרה למטה.",
          en: "Resistance is a price level where sellers enter the market and stop the rise. The chart gets 'rejected' from it and pulls back.",
        },
      },
      {
        question: {
          he: "ממוצע נע של 200 יום — משמש בעיקר לזיהוי?",
          en: "The 200-day moving average is mainly used to identify?",
        },
        options: [
          { he: "נקודות כניסה יומיות למסחר", en: "Daily entry points for trading" },
          { he: "המגמה ארוכת הטווח — שורי או דובי", en: "The long-term trend — bullish or bearish" },
          { he: "תנודות שעתיות", en: "Hourly fluctuations" },
          { he: "עוצמת נפח המסחר", en: "The strength of trading volume" },
        ],
        correct: 1,
        explanation: {
          he: "ממוצע 200 יום מייצג את המגמה ארוכת הטווח. מחיר מעל ל-MA200 נחשב שורי; מחיר מתחתיו — דובי.",
          en: "The 200-day MA represents the long-term trend. A price above the MA200 is considered bullish; below it — bearish.",
        },
      },
      {
        question: {
          he: "מה קורה כשממוצע נע קצר חוצה את הממוצע הנע הארוך כלפי מעלה ('מצלבת הזהב')?",
          en: "What happens when a short moving average crosses above the long moving average ('Golden Cross')?",
        },
        options: [
          { he: "זהו סיגנל מכירה חזק", en: "This is a strong sell signal" },
          { he: "זהו סיגנל קנייה שורי — המגמה הפכה לחיובית", en: "This is a bullish buy signal — the trend has turned positive" },
          { he: "המניה עתידה לרדת 20%", en: "The stock is about to drop 20%" },
          { he: "אין לכך משמעות מיוחדת", en: "It has no special significance" },
        ],
        correct: 1,
        explanation: {
          he: "מצלבת הזהב (MA50 חוצה את MA200 כלפי מעלה) נחשבת לסיגנל קנייה שורי חזק המצביע על מגמת עלייה חדשה.",
          en: "The Golden Cross (MA50 crossing above MA200) is considered a strong bullish buy signal indicating the start of a new uptrend.",
        },
      },
    ],
  },
];

export default quizData;
