import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';

interface Props {
  reference: string;
  onDashboard: () => void;
}

export const KYCSuccess = ({ reference, onDashboard }: Props) => {
  return (
    <div className="space-y-6 text-center">
      <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">KYC Submitted Successfully!</h2>
        <p className="text-muted-foreground">Your verification is being processed</p>
      </div>

      <Card className="card-glow max-w-md mx-auto">
        <CardContent className="pt-6 space-y-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Reference Number:</span>
            <p className="font-mono font-bold text-foreground text-lg">{reference}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-purple" />
              <span className="text-sm font-medium text-foreground">What's Next?</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your application is under review</li>
              <li>We'll notify you via email when complete</li>
              <li>Typical review time: 24–48 hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onDashboard} variant="hero" size="lg">
        Return to Dashboard
      </Button>
    </div>
  );
};
