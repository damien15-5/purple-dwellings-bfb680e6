import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export const MyEscrow = () => {
  const transactions = [
    { id: 1, property: 'Modern House in Lekki', amount: 45000000, status: 'active' },
    { id: 2, property: 'Luxury Villa', amount: 120000000, status: 'completed' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-primary" />
        My Escrow Transactions
      </h1>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active (1)</TabsTrigger>
          <TabsTrigger value="completed">Completed (1)</TabsTrigger>
          <TabsTrigger value="disputed">Disputed (0)</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="card-glow">
            <CardContent className="pt-6">
              {transactions.filter(t => t.status === 'active').map(t => (
                <div key={t.id} className="flex justify-between items-center p-4">
                  <div>
                    <h3 className="font-semibold">{t.property}</h3>
                    <p className="text-2xl font-bold text-primary">₦{t.amount.toLocaleString()}</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="card-glow">
            <CardContent className="pt-6">
              {transactions.filter(t => t.status === 'completed').map(t => (
                <div key={t.id} className="flex justify-between items-center p-4">
                  <div>
                    <h3 className="font-semibold">{t.property}</h3>
                    <p className="text-2xl font-bold">₦{t.amount.toLocaleString()}</p>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
