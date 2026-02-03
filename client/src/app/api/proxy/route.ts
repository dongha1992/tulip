import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await axios.post(
      `${process.env.NEXT_PROXY_TOSS_API_URL}/api/v1/screener/screen/with-chart`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'App-Version': '2025-01-19 22:23:24',
          Origin: 'https://tossinvest.com',
          Referer: 'https://tossinvest.com/screener/user/custom',
          'User-Agent': req.headers.get('user-agent') || '',
          'X-XSRF-TOKEN': req.headers.get('x-xsrf-token') || '',
          Cookie: req.headers.get('cookie') || '',
        },
      },
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
