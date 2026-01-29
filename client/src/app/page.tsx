import { SearchParams } from 'nuqs/server';

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

export default function Home({ searchParams }: HomePageProps) {
  // useEffect(() => {
  //   const getScraper = async () => {
  //     const data = await axios.post('http://127.0.0.1:8000/scrape');
  //     console.log(data);
  //   };

  //   const getSentiment = async () => {
  //     const data = await axios.get('/api/sentiment');
  //     console.log(data);
  //   };

  //   getScraper();
  //   getSentiment();
  // }, []);

  return <div className="">홈</div>;
}
