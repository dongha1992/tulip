'use client';

import styles from './page.module.scss';
import { useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  useEffect(() => {
    const getScraper = async () => {
      // const data = await axios.post('/api/scraper');
      // console.log(data);
    };

    getScraper();
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.page}>ass</div>
    </div>
  );
}
