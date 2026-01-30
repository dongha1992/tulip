export const homePath = () => '/';

export const signUpPath = () => '/sign-up';
export const signInPath = () => '/sign-in';

export const onboardingPath = () => '/onboarding';
export const allTradingPath = () => '/trading';
export const tradingsPath = () => '/tradings';
export const tradingPath = (tradingId: string) => `/tradings/${tradingId}`;
export const tradingEditPath = (tradingId: string) =>
  `/tradings/${tradingId}/edit`;

export const attachmentDownloadPath = (attachmentId: string) =>
  `/api/aws/s3/attachments/${attachmentId}`;
export const passwordForgotPath = () => '/password-forgot';
export const accountProfilePath = () => '/account/profile';
export const accountPasswordPath = () => '/account/password';
