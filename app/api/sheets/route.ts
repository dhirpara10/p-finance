const SHEETS_API_URL = process.env.SHEETS_API_URL;
const SHEETS_API_KEY = process.env.SHEETS_API_KEY;

function getSheetsUrl(action?: string | null) {
  if (!SHEETS_API_URL || !SHEETS_API_KEY) {
    throw new Error("Missing SHEETS_API_URL or SHEETS_API_KEY");
  }

  const url = new URL(SHEETS_API_URL);
  url.searchParams.set("key", SHEETS_API_KEY);

  if (action) {
    url.searchParams.set("action", action);
  }

  return url.toString();
}

export async function GET(request: Request) {
  try {
    const action = new URL(request.url).searchParams.get("action");

    if (!action) {
      return Response.json(
        {
          success: false,
          error: "Missing GET action",
        },
        { status: 400 }
      );
    }

    const finalUrl = getSheetsUrl(action);

    const res = await fetch(finalUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    const text = await res.text();

    if (text.trim().startsWith("<")) {
      return Response.json(
        {
          success: false,
          error: "Apps Script returned HTML instead of JSON",
          finalUrl,
          preview: text.slice(0, 200),
        },
        { status: 500 }
      );
    }

    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message || "GET failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    let action = new URL(request.url).searchParams.get("action");
    let forwardedBody = body;

    if (!action) {
      try {
        const payload = JSON.parse(body);
        action = payload.action || null;
      } catch {
        action = null;
      }
    }

    if (!action) {
      return Response.json(
        {
          success: false,
          error: "Missing POST action",
        },
        { status: 400 }
      );
    }

    try {
      const payload = JSON.parse(body);
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        forwardedBody = JSON.stringify({
          ...payload,
          action,
          key: SHEETS_API_KEY,
        });
      }
    } catch {
      forwardedBody = body;
    }

    const res = await fetch(getSheetsUrl(action), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: forwardedBody,
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message || "POST failed",
      },
      { status: 500 }
    );
  }
}
