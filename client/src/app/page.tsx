'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user } = useAuth();

  const handleAnalyze = async (stockId: string) => {
    // 로그인 여부 체크
    if (!user) {
      return;
    }

    // // 클라이언트 기준: 회원당 하루 한 번만 실행 (user.id 기준으로 기록)
    // if (typeof window !== 'undefined') {
    //   const key = `lastAnalyzeAt:${user.id}`;
    //   const last = window.localStorage.getItem(key);
    //   if (last) {
    //     const lastDate = new Date(last);
    //     const now = new Date();
    //     const diffMs = now.getTime() - lastDate.getTime();
    //     const oneDayMs = 24 * 60 * 60 * 1000;

    //     if (diffMs < oneDayMs) {
    //       alert('감정 분석은 회원당 하루에 한 번만 이용할 수 있습니다.');
    //       return;
    //     }
    //   }
    // }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: stockId }),
      });
      const data = await res.json();
      setResult(data);

      // if (typeof window !== 'undefined') {
      //   const key = `lastAnalyzeAt:${user.id}`;
      //   window.localStorage.setItem(key, new Date().toISOString());
      // }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  console.log(result);

  return (
    <div className="">
      <span>홈</span>
      <div className="flex justify-center items-center">
        <button
          onClick={() => handleAnalyze('AMX0240604001')}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? '분석 중...' : '감정 분석'}
        </button>
      </div>
    </div>
  );
}
