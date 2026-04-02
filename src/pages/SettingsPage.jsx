import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Flame, ArrowLeft, Moon, Bell, Globe, Shield, Smartphone } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold text-foreground">SplitPot</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link to="/profile" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold text-foreground">Settings</h1>
        <p className="mb-8 text-muted-foreground">Manage your app preferences</p>

        {/* Appearance */}
        <Card className="mb-6 border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Moon className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how SplitPot looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6 border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified when a split is finalized</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Email Reminders</Label>
                <p className="text-xs text-muted-foreground">Receive email for unsettled splits</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* General */}
        <Card className="mb-6 border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Globe className="h-5 w-5 text-primary" />
              General
            </CardTitle>
            <CardDescription>App preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Currency</Label>
                <p className="text-xs text-muted-foreground">Default currency for splits</p>
              </div>
              <span className="text-sm font-semibold text-foreground">USD ($)</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Language</Label>
                <p className="text-xs text-muted-foreground">Display language</p>
              </div>
              <span className="text-sm font-semibold text-foreground">English</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start gap-2 font-medium">
              <Shield className="h-4 w-4" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 font-medium text-destructive hover:text-destructive">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
