let cachedCrumb = "";
let cachedCookie = "";
let crumbAge = 0;

export async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (cachedCrumb && Date.now() - crumbAge < 3_600_000) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }

  const cookieRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    redirect: "manual",
  });
  const setCookie = cookieRes.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/A3=[^;]+/);
  cachedCookie = match ? match[0] : "";

  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      Cookie: cachedCookie,
    },
  });
  const crumb = await crumbRes.text();
  if (crumb && !crumb.includes("error") && !crumb.includes("{")) {
    cachedCrumb = crumb.trim();
    crumbAge = Date.now();
  }

  return { crumb: cachedCrumb, cookie: cachedCookie };
}

export async function yahooQuoteSummary(symbol: string, modules: string) {
  const { crumb, cookie } = await getYahooCrumb();
  const res = await fetch(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol.toUpperCase()}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Cookie: cookie },
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);
  const data = await res.json();
  return data?.quoteSummary?.result?.[0] ?? null;
}
