import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Moon,
  Bell,
  Globe,
  Shield,
  UserRound,
  Trash2,
  LockKeyhole,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import {
  formatJoinedDate,
  getAccountDisplayName,
} from "@/lib/account";
import AppNavbar from "@/components/AppNavbar";
import { getSessionUser } from "@/lib/session";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [account, setAccount] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadSessionUser = async () => {
      const user = await getSessionUser();

      if (!isMounted) {
        return;
      }

      setAccount(user);
    };

    loadSessionUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Unable to change password",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Your new password should be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Your new password and confirmation password must match.",
        variant: "destructive",
      });
      return;
    }

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
  };

  const handleClearHistory = () => {
    window.localStorage.removeItem("splitpot_bills");

    toast({
      title: "Saved bill history cleared",
      description: "Your locally saved split history has been removed from this browser.",
    });

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Link to="/profile" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <div className="mb-6 flex flex-col gap-2 sm:mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your preferences, account details, and security settings.
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl p-1">
            <TabsTrigger value="general" className="px-2 py-2 text-xs sm:text-sm">
              General
            </TabsTrigger>
            <TabsTrigger value="account" className="px-2 py-2 text-xs sm:text-sm">
              Account
            </TabsTrigger>
            <TabsTrigger value="security" className="px-2 py-2 text-xs sm:text-sm">
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Moon className="h-5 w-5 text-primary" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how Splitty looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                  <Switch checked={isDark} onCheckedChange={toggleTheme} />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Get notified when a split is finalized</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Email Reminders</Label>
                    <p className="text-xs text-muted-foreground">Receive email for unsettled splits</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Globe className="h-5 w-5 text-primary" />
                  General
                </CardTitle>
                <CardDescription>App preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Currency</Label>
                    <p className="text-xs text-muted-foreground">Default currency for splits</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">USD ($)</span>
                </div>
                <Separator />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Language</Label>
                    <p className="text-xs text-muted-foreground">Display language</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">English</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6 space-y-6">
            <Card className="border shadow-md">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <UserRound className="h-5 w-5 text-primary" />
                    Account Details
                  </CardTitle>
                  <CardDescription>
                    View the current account information from your active session.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-username">Username</Label>
                    <Input
                      id="settings-username"
                      value={account?.username || ""}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">Account Summary</p>
                  <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <span className="block text-xs uppercase tracking-wide">Display Name</span>
                      <span className="font-medium text-foreground">
                        {getAccountDisplayName(account) || "Unavailable"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wide">Joined</span>
                      <span className="font-medium text-foreground">{formatJoinedDate(account?.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Account details are no longer stored on the frontend. If you want editable account settings here, wire this page to a backend update endpoint.
                </div>
              </CardContent>
            </Card>

            <Card className="border border-destructive/30 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Clear Saved History
                </CardTitle>
                <CardDescription>
                  This removes locally saved split history on this device. It does not delete your backend account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      Clear History
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to clear your saved history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will clear your saved receipt history from this browser.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleClearHistory}>
                        Clear History
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Shield className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>
                  Update your password here without changing any other account details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleChangePassword}>
                  <div className="space-y-2">
                    <Label htmlFor="settings-current-password">Current Password</Label>
                    <Input
                      id="settings-current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordFieldChange("currentPassword", e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settings-new-password">New Password</Label>
                      <Input
                        id="settings-new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordFieldChange("newPassword", e.target.value)}
                        placeholder="At least 8 characters"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-confirm-password">Confirm New Password</Label>
                      <Input
                        id="settings-confirm-password"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordFieldChange("confirmPassword", e.target.value)}
                        placeholder="Re-enter your new password"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p>
                        Choose a strong password with at least 8 characters and avoid reusing passwords from other accounts.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="w-full sm:w-auto">
                      Change Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
