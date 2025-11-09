import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mail, Bell, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/hooks/useAuthStore";
import { authService } from "@/lib/authService";
import { firestoreService } from "@/lib/firestoreService";

const NOTIFICATION_FREQUENCY_OPTIONS = [
  { value: 30, label: "Every 30 seconds" },
  { value: 60, label: "Every 1 minute" },
  { value: 300, label: "Every 5 minutes" },
  { value: 600, label: "Every 10 minutes" },
  { value: 900, label: "Every 15 minutes" },
];

export default function Profile() {
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [ergonomicGoal, setErgonomicGoal] = useState("both");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Initialize user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      // Set initial values from Firebase Auth
      setFullName(user.displayName || user.email?.split('@')[0] || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Notification state
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState<number>(60);

  // Fetch user profile from Firestore when user is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          // Fetch additional profile data from Firestore
          const profileData = await firestoreService.getUser(user.uid);
          console.log("Fetched profile data:", profileData); // Debug log
          if (profileData) {
            // Update form fields with values from Firestore, prioritizing Firestore data over Auth data
            setFullName(profileData.name || user.displayName || user.email?.split('@')[0] || "");
            setOccupation(profileData.occupation || "");
            setErgonomicGoal(profileData.ergonomicGoal || "both");
            setAge(profileData.age?.toString() || "");
            setGender(profileData.gender || "");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Continue with default values if profile fetch fails
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      if (!user) return;
      try {
        const settings = await firestoreService.getUserSettings(user.uid);
        if (settings) {
          if (typeof settings.notificationFrequency === "number") {
            setNotificationFrequency(settings.notificationFrequency);
          }
          if (typeof settings.emailAlerts === "boolean") {
            setEmailAlertsEnabled(settings.emailAlerts);
          }
          if (typeof settings.alertEmail === "string" && settings.alertEmail.length > 0) {
            setEmail(settings.alertEmail);
          }
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      }
    };

    fetchNotificationSettings();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      // Validate user exists
      if (!user) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to update your profile.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Update user profile in Firebase Auth (for display name)
      try {
        await authService.updateProfile({ displayName: fullName });
      } catch (authError) {
        console.error("Error updating auth profile:", authError);
        throw new Error("Failed to update authentication profile");
      }
      
      // Prepare profile data for Firestore with proper type handling
      const profileData: any = {
        name: fullName,
        email: user.email,
        occupation,
        ergonomicGoal,
        gender,
        updatedAt: new Date(),
      };
      
      // Only add age if it's a valid number within the allowed range (0-67)
      if (age && !isNaN(parseInt(age))) {
        const ageValue = parseInt(age);
        if (ageValue >= 0 && ageValue <= 67) {
          profileData.age = ageValue;
        } else {
          toast({
            title: "Invalid age",
            description: "Age must be between 0 and 67.",
            variant: "destructive",
            duration: 3000,
          });
          return; // Stop execution if age is out of range
        }
      }
      
      console.log("Saving profile data:", profileData); // Debug log
      
      // Update comprehensive user profile in Firestore
      try {
        await firestoreService.updateUser(user.uid, profileData);
      } catch (dbError) {
        console.error("Error updating Firestore profile:", dbError);
        throw new Error("Failed to update profile database");
      }

      toast({
        title: "Profile updated successfully!",
        description: "Your profile settings have been saved.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Error updating profile",
        description: error.message || "There was an issue saving your profile.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const formatFrequencyLabel = (value: number) => {
    const match = NOTIFICATION_FREQUENCY_OPTIONS.find((option) => option.value === value);
    return match ? match.label : `Every ${value} seconds`;
  };

  const persistSettings = async (settings: { notificationFrequency?: number; emailAlerts?: boolean; alertEmail?: string }) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to update notification settings.",
        variant: "destructive",
        duration: 3000,
      });
      throw new Error("User not authenticated");
    }

    await firestoreService.updateUserSettings(user.uid, settings);
  };

  const handleNotificationFrequencyChange = async (value: string) => {
    const nextValue = Number(value);
    if (Number.isNaN(nextValue)) return;
    const previousValue = notificationFrequency;
    setNotificationFrequency(nextValue);

    try {
      await persistSettings({
        notificationFrequency: nextValue,
        emailAlerts: emailAlertsEnabled,
      });
      toast({
        title: "Notification frequency updated!",
        description: `You'll receive reminders ${formatFrequencyLabel(nextValue).toLowerCase()}.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating notification frequency:", error);
      setNotificationFrequency(previousValue);
      toast({
        title: "Unable to update frequency",
        description: "Please try again shortly.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEmailAlertsToggle = async (checked: boolean) => {
    const previous = emailAlertsEnabled;
    setEmailAlertsEnabled(checked);
    try {
      await persistSettings({
        emailAlerts: checked,
        notificationFrequency,
      });
      toast({
        title: checked ? "Email alerts enabled" : "Email alerts disabled",
        description: checked
          ? "We'll send reminders to your inbox."
          : "You won't receive posture reminders via email.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating email alerts:", error);
      setEmailAlertsEnabled(previous);
      toast({
        title: "Unable to update email alerts",
        description: "Please try again later.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSaveEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    try {
      await persistSettings({
        alertEmail: email,
        emailAlerts: emailAlertsEnabled,
        notificationFrequency,
      });
      toast({
        title: "Email saved!",
        description: "You'll now receive posture check-in reminders via email.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving alert email:", error);
      toast({
        title: "Unable to save email",
        description: "Please try again later.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="pt-28 px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Profile & Settings
          </h1>
          <p className="text-muted-foreground">Manage your profile and notification preferences</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Profile Settings Card */}
          <div className="glass rounded-2xl p-6 float-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="text-primary">●</span>
              Your Profile
            </h2>

            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground flex items-center justify-center shadow-lg transition-all hover:scale-110">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-strong border-border/50 focus:border-primary"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-strong border-border/50 focus:border-primary"
                  placeholder="Enter your email"
                  disabled // Can't edit email directly here in Firebase
                />
              </div>

              <div>
                <Label htmlFor="occupation" className="text-sm font-medium mb-2 block">
                  Occupation / Role
                </Label>
                <Input
                  id="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="glass-strong border-border/50 focus:border-primary"
                  placeholder="e.g., Software Engineer, Student"
                />
              </div>

              <div>
                <Label htmlFor="goal" className="text-sm font-medium mb-2 block">
                  Ergonomic Goal
                </Label>
                <Select value={ergonomicGoal} onValueChange={setErgonomicGoal}>
                  <SelectTrigger className="glass-strong border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="posture">Better posture</SelectItem>
                    <SelectItem value="wrist">Reduce wrist pain</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="text-sm font-medium mb-2 block text-muted-foreground">
                    Age (optional)
                  </Label>
                  <Input
                    id="age"
                    value={age}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers between 0 and 67
                      if (value === "" || (Number(value) >= 0 && Number(value) <= 67)) {
                        setAge(value);
                      }
                    }}
                    className="glass-strong border-border/50 focus:border-primary"
                    placeholder="0-67"
                    type="number"
                    min="0"
                    max="67"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-sm font-medium mb-2 block text-muted-foreground">
                    Gender (optional)
                  </Label>
                  <Input
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="glass-strong border-border/50 focus:border-primary"
                    placeholder="Your gender"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground mt-2"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Notifications Settings Card */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 float-card">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications & Reminders
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Choose how you'd like to receive posture and RSI reminders.
              </p>

              <div className="space-y-4">
                {/* Email Alerts */}
                <div className="flex items-center justify-between p-4 rounded-lg glass-strong border border-border/50">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email Alerts</p>
                      <p className="text-xs text-muted-foreground">Receive reminders via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={emailAlertsEnabled}
                    onCheckedChange={handleEmailAlertsToggle}
                  />
                </div>

                {/* Email Input (shown when enabled) */}
                {emailAlertsEnabled && (
                  <div className="ml-8 space-y-3 animate-fade-in">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Enter your email to receive reminders:
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-strong border-border/50 focus:border-primary flex-1"
                        placeholder="your.email@example.com"
                      />
                      <Button
                        onClick={handleSaveEmail}
                        size="sm"
                        className="bg-primary hover:bg-primary-dark text-primary-foreground"
                      >
                        Save Email
                      </Button>
                    </div>
                  </div>
                )}

                {/* Slack Alerts (Coming Soon) */}
                <div className="flex items-center justify-between p-4 rounded-lg glass-strong border border-border/50 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <span className="text-lg">💬</span>
                    </div>
                    <div>
                      <p className="font-medium">Slack Alerts</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                  <Switch disabled checked={false} />
                </div>

                {/* Discord Alerts (Coming Soon) */}
                <div className="flex items-center justify-between p-4 rounded-lg glass-strong border border-border/50 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <span className="text-lg">🎮</span>
                    </div>
                    <div>
                      <p className="font-medium">Discord Alerts</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                  <Switch disabled checked={false} />
                </div>
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="glass rounded-2xl p-6 float-card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-primary">⏰</span>
                Notification Frequency
              </h3>

              <div className="space-y-3">
                <Label htmlFor="notification-frequency" className="text-sm font-medium">
                  How often should we check in?
                </Label>
                <Select
                  value={String(notificationFrequency)}
                  onValueChange={handleNotificationFrequencyChange}
                >
                  <SelectTrigger
                    id="notification-frequency"
                    className="glass-strong border-border/50 focus:border-primary"
                  >
                    <SelectValue placeholder="Select reminder cadence" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {NOTIFICATION_FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="mt-4 text-xs text-muted-foreground leading-relaxed glass-strong rounded-xl p-3 border border-border/50">
                A posture alert will be sent if over 50% of your selected interval is detected as poor posture.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - moved to AuthenticatedLayout */}
      </div>
    </div>
  );
}
