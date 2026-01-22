export type NavItem = {
  separator?: boolean;
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  href: string;
};
