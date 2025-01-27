'use client';

import styles from './page.module.scss';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  useEffect(() => {
    const getScraper = async () => {
      const data = await axios.post('http://127.0.0.1:8000/scrape');
      console.log(data);
    };

    const getSentiment = async () => {
      const data = await axios.get('/api/sentiment');
      console.log(data);
    };

    // getScraper();
    getSentiment();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.page}>ass</div>
    </div>
  );
}
