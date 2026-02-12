import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileCheck, Camera, Clock } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export const KYCWelcome = ({ onNext }: Props) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-accent-purple/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-10 w-10 text-accent-purple" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Identity Verification</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Complete your KYC verification to unlock full access to our platform. This process helps us keep everyone safe.
        </p>
      </div>

      <Card className="card-glow">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">What you'll need:</h3>
          <div className="space-y-3">
            {[
              { icon: FileCheck, text: 'A valid Nigerian ID (NIN, Passport, Driver\'s License, or Voter\'s Card)' },
              { icon: Camera, text: 'A clear selfie photo for identity confirmation' },
              { icon: Clock, text: 'About 5-10 minutes to complete the process' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-accent-purple" />
                </div>
                <p className="text-sm text-foreground">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="card-glow border-accent-purple/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Privacy Notice:</strong> Your documents are encrypted and stored securely. 
            We comply with the Nigeria Data Protection Regulation (NDPR). Your data will only be used for verification purposes.
          </p>
        </CardContent>
      </Card>

      <Button onClick={onNext} className="w-full" variant="hero" size="lg">
        Start Verification
      </Button>
    </div>
  );
};
