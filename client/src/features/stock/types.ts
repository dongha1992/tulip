export type StockBadgeVariant =
  | 'destructive'
  | 'positive'
  | 'neutral'
  | 'slightly-negative'
  | 'slightly-positive';

export type StockTop5Item = {
  name: string;
  symbol: string;
  totalOwubu: number;
  sentiment: string;
  percent: number;
  badgeVariant: StockBadgeVariant;
};

/** 해외주식 거래대금순위 API - Query Parameter */
export type TradeAmountRankingQuery = {
  /** 거래소코드 NYS|NAS|AMS*/
  EXCD: 'NYS' | 'NAS' | 'AMS';
  /** N일자값 0(당일)~9(1년) */
  NDAY: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  /** 거래량조건 0(전체)~6 */
  VOL_RANG: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  /** 현재가 필터 범위 1 (가격~) */
  PRC1: string;
  /** 현재가 필터 범위 2 (~가격) */
  PRC2: string;
  KEYB?: string;
  AUTH?: string;
};

/** 해외주식 거래대금순위 API - output2 한 건 */
export type TradeAmountRankingItem = {
  rsym: string;
  excd: string;
  symb: string;
  name: string;
  last: string;
  sign: string;
  diff: string;
  rate: string;
  pask: string;
  pbid: string;
  tvol: string;
  tamt: string;
  a_tamt: string;
  rank: string;
  ename: string;
  e_ordyn: string;
};

/** 해외주식 거래대금순위 API - Response Body */
export type TradeAmountRankingResponse = {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output1: {
    zdiv: string;
    stat: string;
    crec: string;
    trec: string;
    nrec: string;
  };
  output2: TradeAmountRankingItem[];
};

/** S3에 저장된 주식 메타 정보 */
export type StocksMetaInfoResponse = {
  stockCode: string;
  name: string;
  logoImageUrl: string;
  ticker: string;
  EXCD: string;
};

/** 해외주식 상품기본정보 API - Query Parameter */
export type OverseasStockBasicInfoQuery = {
  /** 상품유형코드 (예: 512 미국 나스닥, 513 미국 뉴욕 등) */
  PRDT_TYPE_CD: string;
  /** 상품번호 (예: AAPL) */
  PDNO: string;
};

/** 해외주식 상품기본정보 API - output 한 건 */
export type OverseasStockBasicInfoOutput = {
  std_pdno: string;
  prdt_eng_name: string;
  natn_cd: string;
  natn_name: string;
  tr_mket_cd: string;
  tr_mket_name: string;
  ovrs_excg_cd: string;
  ovrs_excg_name: string;
  tr_crcy_cd: string;
  ovrs_papr: string;
  crcy_name: string;
  ovrs_stck_dvsn_cd: string;
  prdt_clsf_cd: string;
  prdt_clsf_name: string;
  sll_unit_qty: string;
  buy_unit_qty: string;
  tr_unit_amt: string;
  lstg_stck_num: string;
  lstg_dt: string;
  ovrs_stck_tr_stop_dvsn_cd: string;
  lstg_abol_item_yn: string;
  ovrs_stck_prdt_grp_no: string;
  lstg_yn: string;
  tax_levy_yn: string;
  ovrs_stck_erlm_rosn_cd: string;
  ovrs_stck_hist_rght_dvsn_cd: string;
  chng_bf_pdno: string;
  prdt_type_cd_2: string;
  ovrs_item_name: string;
  sedol_no: string;
  blbg_tckr_text: string;
  ovrs_stck_etf_risk_drtp_cd: string;
  etp_chas_erng_rt_dbnb: string;
  istt_usge_isin_cd: string;
  mint_svc_yn: string;
  mint_svc_yn_chng_dt: string;
  prdt_name: string;
  lei_cd: string;
  ovrs_stck_stop_rson_cd: string;
  lstg_abol_dt: string;
  mini_stk_tr_stat_dvsn_cd: string;
  mint_frst_svc_erlm_dt: string;
  mint_dcpt_trad_psbl_yn: string;
  mint_fnum_trad_psbl_yn: string;
  mint_cblc_cvsn_ipsb_yn: string;
  ptp_item_yn: string;
  ptp_item_trfx_exmt_yn: string;
  ptp_item_trfx_exmt_strt_dt: string;
  ptp_item_trfx_exmt_end_dt: string;
  dtm_tr_psbl_yn: string;
  sdrf_stop_ecls_yn: string;
  sdrf_stop_ecls_erlm_dt: string;
  memo_text1: string;
  ovrs_now_pric1: string;
  last_rcvg_dtime: string;
};

/** 해외주식 상품기본정보 API - Response Body */
export type OverseasStockBasicInfoResponse = {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: OverseasStockBasicInfoOutput;
};

/** SEC company_tickers.json 엔트리 */
export type SecCompanyTickerEntry = {
  cik_str: string;
  ticker: string;
  title: string;
};

export type SecCompanyTickerMap = Record<string, SecCompanyTickerEntry>;

export interface CompanyFactsResponse {
  cik: number;
  entityName: string;

  facts: {
    /** taxonomy: us-gaap | dei | invest | ifrs-full | srt | etc */
    [taxonomy: string]: {
      /** concept: Revenues | NetIncomeLoss | Assets | ... */
      [concept: string]: SecConceptFacts;
    };
  };

  /** SEC가 추가로 붙일 수 있는 필드들 (열린 타입 유지) */
  [k: string]: unknown;
}

export interface SecConceptFacts {
  label?: string;
  description?: string;

  /** unit: USD | shares | pure | USD/shares | USD-per-shares | etc */
  units: {
    [unit: string]: SecFactItem[];
  };

  /** concept 레벨에서도 SEC가 필드 추가 가능 */
  [k: string]: unknown;
}

export interface SecFactItem {
  /** 기간 종료일 (필수) */
  end: string; // YYYY-MM-DD

  /** 기간 시작일 (기간형 fact만 존재) */
  start?: string;

  /** 값 */
  val: number;

  /** accession number */
  accn: string;

  /** fiscal year */
  fy?: number;

  /** fiscal period: FY/Q1/Q2/Q3/Q4 등 */
  fp?: 'FY' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | string;

  /** filing form: 10-Q, 10-K, 8-K ... */
  form?: string;

  /** filed date */
  filed?: string;

  /** calendar frame */
  frame?: string;

  /** SEC가 개별 아이템에 필드 추가 가능 */
  [k: string]: unknown;
}

export type SecCompanyFacts = {
  cik: number;
  entityName: string;
  facts?: Record<
    string, // taxonomy: "us-gaap" | "dei" | ...
    Record<
      string, // tag
      {
        label?: string;
        description?: string;
        units?: Record<
          string, // unit: "USD" | "shares" | "USD/shares" | ...
          Array<{
            start?: string;
            end: string;
            val: number;
            accn?: string;
            fy?: number;
            fp?: string; // "Q1" | "Q2" | "Q3" | "FY" ...
            form?: string;
            filed?: string;
            frame?: string;
          }>
        >;
      }
    >
  >;
};

export type Growth5y =
  | { kind: 'cagr'; value: number }
  | { kind: 'turnaround'; label: string; year?: number }
  | { kind: 'na' };
