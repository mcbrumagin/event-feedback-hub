import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FeedbackCardProps {
  feedback: {
    id: string;
    text: string;
    rating: number;
    createdAt: string;
    event?: {
      name: string;
    };
  };
  showEventName?: boolean;
  isNew?: boolean;
}

export function FeedbackCard({ feedback, showEventName = false, isNew = false }: FeedbackCardProps) {
  return (
    <Card className={cn(
      'transition-all duration-300',
      isNew && 'ring-2 ring-primary animate-pulse-subtle'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {showEventName && feedback.event && (
              <p className="text-xs text-muted-foreground mb-1">
                {feedback.event.name}
              </p>
            )}
            <p className="text-sm text-foreground leading-relaxed">
              {feedback.text}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StarRating rating={feedback.rating} readonly size="sm" />
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(feedback.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
