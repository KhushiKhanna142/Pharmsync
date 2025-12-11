import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
} from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiring: true,
    reorders: false,
    reports: true,
  });

  return (
    <div className="space-y-8 pt-12 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your pharmacy system preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pharmacy Info */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Pharmacy Information
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Pharmacy Name</Label>
                <Input id="name" defaultValue="PharmSync Central" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input id="license" defaultValue="PH-2024-001234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="contact@pharmsync.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  defaultValue="123 Healthcare Blvd, Medical District, MD 12345"
                />
              </div>
            </div>

            <Button className="mt-6">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Notification Preferences
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "lowStock",
                  label: "Low Stock Alerts",
                  description: "Get notified when items fall below threshold",
                },
                {
                  id: "expiring",
                  label: "Expiry Warnings",
                  description: "Alerts for medications nearing expiry",
                },
                {
                  id: "reorders",
                  label: "Reorder Reminders",
                  description: "Automatic reorder suggestions",
                },
                {
                  id: "reports",
                  label: "Weekly Reports",
                  description: "Receive summary reports via email",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    checked={notifications[item.id as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.id]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="font-semibold text-foreground">Security</h2>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Auth
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Active Sessions
              </Button>
            </div>
          </div>

          {/* Data */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Database className="h-5 w-5 text-accent" />
              </div>
              <h2 className="font-semibold text-foreground">Data Management</h2>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Export Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Backup Settings
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                Clear Cache
              </Button>
            </div>
          </div>

          {/* Theme */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-secondary p-2">
                <Palette className="h-5 w-5 text-secondary-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">Appearance</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              PharmSync uses a clean, clinical design optimized for healthcare environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
