import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Activity } from 'lucide-react';

const AdminAILogs = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Logs</h1>
        <p className="text-muted-foreground mt-1">View AI verification and interaction logs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Verifications
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Interactions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">AI Logs Coming Soon</p>
            <p className="text-sm mt-2">This feature will track all AI verification attempts and interactions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAILogs;