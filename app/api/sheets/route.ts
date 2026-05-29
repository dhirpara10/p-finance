const SHEETS_API_URL = process.env.SHEETS_API_URL;
const SHEETS_API_KEY = process.env.SHEETS_API_KEY;

function getSheetsUrl() {
  if (!SHEETS_API_URL || !SHEETS_API_KEY) {
    throw new Error("Missing SHEETS_API_URL or SHEETS_API_KEY");
  }

  return `${SHEETS_API_URL}?key=${encodeURIComponent(SHEETS_API_KEY)}`;
}

export async function GET() {
  try {
    const finalUrl = getSheetsUrl();

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

    const res = await fetch(getSheetsUrl(), {
      method: "POST",
      body,
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