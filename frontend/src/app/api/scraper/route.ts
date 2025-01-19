import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';
import axios from 'axios';

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

interface StockFeed {
  href: string;
  text: string;
  imageSrc: string | null;
}

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

const openBrowser = async () => {
  await chromium.font(
    'https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf',
  );

  const isLocal = !!process.env.CHROME_EXECUTABLE_PATH;
  const browser = await puppeteer.launch({
    args: isLocal
      ? puppeteer.defaultArgs()
      : [...chromium.args, '--hide-scrollbars', '--incognito', '--no-sandbox'],
    defaultViewport: chromium.defaultViewport,
    executablePath:
      process.env.CHROME_EXECUTABLE_PATH ||
      (await chromium.executablePath(
        'https://my-tulip-assets.s3.ap-northeast-2.amazonaws.com/chromium-v126.0.0-pack.tar',
      )),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();

    await page.goto(
      'https://tossinvest.com/stocks/US20200827001/community?feedSortType=RECENT',
      {
        waitUntil: 'networkidle0',
        timeout: 120000,
      },
    );

    await page.waitForSelector('ul[data-list-name="StocksFeed"]', {
      timeout: 120000,
    });

    let previousHeight;
    let scrollCount = 0;
    const maxScrolls = 1;
    // while (scrollCount < maxScrolls) {
    //   const currentHeight = await page.evaluate('document.body.scrollHeight');
    //   if (currentHeight === previousHeight) break;
    //   previousHeight = currentHeight;
    //   await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    //   await page.waitForSelector('ul[data-list-name="StocksFeed"]', {
    //     timeout: 30000,
    //   });
    //   scrollCount++;
    // }

    const content: string = await page.content();

    await page.close();
    await browser.close();

    return content;
  } catch (error) {
    console.error('Error in openBrowser:', error);
    return null;
  }
};

const getHtml = async () => {
  try {
    const data = await openBrowser();

    if (!data) {
      return new Response('Failed to fetch HTML content', { status: 500 });
    }

    const $ = cheerio.load(data) as cheerio.CheerioAPI;

    const stocksFeed: StockFeed[] | null = $(
      'ul[data-list-name="StocksFeed"] a[data-tossinvest-log="Link"][data-contents-label="[object Object]"]',
    )
      .map((_, element) => {
        const $element = $(element);
        const text = $element.find('span._60z0ev1').text().trim();
        const imageSrc = $element
          .find('div[data-parent-name="EditorImageElement"] img')
          .attr('src');
        return {
          href: $element.attr('href'),
          text: text,
          imageSrc: imageSrc || null,
        };
      })
      .get();
    console.log(stocksFeed, 'stocksFeed');

    return stocksFeed;
  } catch (e) {
    console.log(e);
  }
};

export async function POST() {
  const stocksFeed = await getHtml();
  const { data } = await axios.post('http://127.0.0.1:8000/compare-images', {
    target_image:
      'https://tulip-img.s3.ap-northeast-2.amazonaws.com/target.webp',
    images: (stocksFeed as StockFeed[]).map((feed) => feed.imageSrc),
  });

  console.log(data, 'data');
  return Response.json({
    data: data,
  });
}
