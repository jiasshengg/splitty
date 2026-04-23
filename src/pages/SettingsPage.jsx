import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Moon,
  Bell,
  Globe,
  Shield,
  UserRound,
  Pencil,
  Save,
  X,
  LockKeyhole,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/hooks/use-toast";
import {
  formatJoinedDate,
  getAccountDisplayName,
} from "@/lib/account";
import AppNavbar from "@/components/AppNavbar";
import { getCurrentUserDetails, updateCurrentUserDetails } from "@/lib/session";

const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const [account, setAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadUserDetails = async () => {
      const user = await getCurrentUserDetails();

      if (!isMounted) {
        return;
      }

      setAccount(user);
      setAccountForm({
        username: user?.username || "",
        email: user?.email || "",
      });
    };

    loadUserDetails();

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

  const handleAccountFieldChange = (field, value) => {
    setAccountForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();

    const username = accountForm.username.trim();
    const email = accountForm.email.trim();

    if (!username || !email) {
      toast({
        title: "Unable to save account details",
        description: "Please fill in your username and email.",
        variant: "destructive",
      });
      return;
    }

    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!looksLikeEmail) {
      toast({
        title: "Invalid email address",
        description: "Please enter a valid email before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingAccount(true);

    try {
      const updatedAccount = await updateCurrentUserDetails({ username, email });

      setAccount((prev) => ({
        ...prev,
        ...updatedAccount,
      }));
      setAccountForm({
        username: updatedAccount?.username || username,
        email: updatedAccount?.email || email,
      });
      setIsEditingAccount(false);

      toast({
        title: "Account updated",
        description: "Your account details have been saved.",
      });
    } catch (error) {
      toast({
        title: "Unable to save account details",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleCancelAccountEdit = () => {
    setAccountForm({
      username: account?.username || "",
      email: account?.email || "",
    });
    setIsEditingAccount(false);
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
                  <Switch checked={false} disabled />
                </div>
                <Separator />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Email Reminders</Label>
                    <p className="text-xs text-muted-foreground">Receive email for unsettled splits</p>
                  </div>
                  <Switch checked={false} disabled />
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
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <UserRound className="h-5 w-5 text-primary" />
                    Account Details
                  </CardTitle>
                  <CardDescription>
                    View and update your account information.
                  </CardDescription>
                </div>
                {!isEditingAccount ? (
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditingAccount(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSaveAccount}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settings-username">Username</Label>
                      <Input
                        id="settings-username"
                        value={accountForm.username}
                        disabled={!isEditingAccount || isSavingAccount}
                        onChange={(e) => handleAccountFieldChange("username", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-email">Email</Label>
                      <Input
                        id="settings-email"
                        type="email"
                        value={accountForm.email}
                        disabled={!isEditingAccount || isSavingAccount}
                        onChange={(e) => handleAccountFieldChange("email", e.target.value)}
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
                        <span className="font-medium text-foreground">{formatJoinedDate(account?.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {isEditingAccount ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleCancelAccountEdit} disabled={isSavingAccount}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto" disabled={isSavingAccount}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSavingAccount ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  ) : null}
                </form>
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
