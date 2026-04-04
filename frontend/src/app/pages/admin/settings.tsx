import { useState } from "react";
import { Settings as SettingsIcon, Bell, Lock, CreditCard, Globe, Save } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";
import { toast } from "sonner";

export function AdminSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground mb-1">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl space-y-6">
        {/* Notifications */}
        <Card className="bg-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-card-foreground">Notifications</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about new bookings and cancellations
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get text messages for urgent booking updates
                </p>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Booking Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send automatic reminders to customers 24 hours before
                </p>
              </div>
              <Switch
                checked={bookingReminders}
                onCheckedChange={setBookingReminders}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive tips and updates from BarberBrody
                </p>
              </div>
              <Switch
                checked={marketingEmails}
                onCheckedChange={setMarketingEmails}
              />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="bg-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-card-foreground">Security</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
              />
            </div>
            <Button variant="outline">Update Password</Button>
          </div>
        </Card>

        {/* Billing */}
        <Card className="bg-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-card-foreground">Billing & Subscription</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div>
                <p className="text-card-foreground mb-1">Current Plan</p>
                <p className="text-2xl text-primary">Professional</p>
                <p className="text-sm text-muted-foreground">
                  $49/month • Next billing: April 20, 2026
                </p>
              </div>
              <Button variant="outline">Manage Plan</Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-muted">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-card-foreground">
                      •••• •••• •••• 4242
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires 12/2026
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Regional Settings */}
        <Card className="bg-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="text-card-foreground">Regional Settings</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value="America/New_York (EST)"
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value="USD ($)"
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value="English (US)"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-destructive/20">
          <div className="p-6 border-b border-border">
            <h3 className="text-destructive">Danger Zone</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-card-foreground mb-1">
                  Close Account
                </p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your barbershop account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
