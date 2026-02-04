'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (stockId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: stockId }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  console.log(result);

  return (
    <div className="">
      홈
      <button onClick={() => handleAnalyze('AMX0240604001')} disabled={loading}>
        {loading ? '분석 중...' : '감정 분석'}
      </button>
    </div>
  );
}
