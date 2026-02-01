import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';

type CardCompactProps = {
  title: string;
  description: string;
  className?: string;
  content: React.ReactNode;
  footer?: React.ReactNode;
};

const CardCompact = ({
  title,
  description,
  className,
  content,
  footer,
}: CardCompactProps) => {
  return (
    <Card className={className}>
      {title || description ? (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      ) : (
        <CardHeader className="p-2" />
      )}
      <CardContent className={!title || !description ? 'p-2' : ''}>
        {content}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-between">{footer}</CardFooter>
      )}
    </Card>
  );
};

export { CardCompact };
