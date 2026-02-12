import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User } from 'lucide-react';
import { nigerianStates } from '@/utils/nigerianData';

export interface PersonalInfoData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
}

interface Props {
  data: PersonalInfoData;
  onChange: (data: PersonalInfoData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const KYCPersonalInfo = ({ data, onChange, onNext, onBack }: Props) => {
  const update = (field: keyof PersonalInfoData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isValid = data.full_name && data.date_of_birth && data.gender && data.phone && data.address && data.state && data.lga;

  return (
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent-purple" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={data.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Input type="date" value={data.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={data.gender} onValueChange={v => update('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input value={data.nationality} onChange={e => update('nationality', e.target.value)} placeholder="Nigerian" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+234 xxx xxx xxxx" />
              <p className="text-xs text-muted-foreground">Format: +2348012345678 or 08012345678</p>
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select value={data.state} onValueChange={v => update('state', v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {nigerianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>LGA *</Label>
              <Input value={data.lga} onChange={e => update('lga', e.target.value)} placeholder="Local Government Area" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Residential Address *</Label>
            <Textarea value={data.address} onChange={e => update('address', e.target.value)} placeholder="Enter your full residential address" rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="hero" onClick={onNext} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  );
};
