'use client';

import { useState } from 'react';
import { Save, Moon, Sun, Bell, Lock, Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: 'system',
    emailNotifications: true,
    weeklyDigest: true,
    auditRetention: '365',
    sessionTimeout: '60',
    twoFactorRequired: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // backend_pending: Save to API
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage application settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </div>
            </div>
            <Select
              value={settings.theme}
              onValueChange={(v) => setSettings({ ...settings, theme: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive email notifications for important updates
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(v) =>
                setSettings({ ...settings, emailNotifications: v })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Weekly Digest</div>
              <div className="text-sm text-muted-foreground">
                Receive a weekly summary of activity
              </div>
            </div>
            <Switch
              checked={settings.weeklyDigest}
              onCheckedChange={(v) =>
                setSettings({ ...settings, weeklyDigest: v })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Configure security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Session Timeout</div>
              <div className="text-sm text-muted-foreground">
                Automatically log out after inactivity
              </div>
            </div>
            <Select
              value={settings.sessionTimeout}
              onValueChange={(v) =>
                setSettings({ ...settings, sessionTimeout: v })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Require 2FA for all users in this organization
              </div>
            </div>
            <Switch
              checked={settings.twoFactorRequired}
              onCheckedChange={(v) =>
                setSettings({ ...settings, twoFactorRequired: v })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Configure data retention and export settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Audit Log Retention</div>
              <div className="text-sm text-muted-foreground">
                How long to keep audit log entries
              </div>
            </div>
            <Select
              value={settings.auditRetention}
              onValueChange={(v) =>
                setSettings({ ...settings, auditRetention: v })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
                <SelectItem value="0">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Export Data</div>
                <div className="text-sm text-muted-foreground">
                  Download all organization data as JSON
                </div>
              </div>
              <Button variant="outline">Export</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions - proceed with caution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Delete Organization</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data
              </div>
            </div>
            <Button variant="destructive" disabled>
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
