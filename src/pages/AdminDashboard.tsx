import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, Users, Settings, Activity, Shield, 
  TrendingUp, DollarSign, Clock, CheckCircle2, XCircle 
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [settings, setSettings] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/");
          return;
        }

        setUser(session.user);

        // Check if user is admin using edge function (bypasses RLS)
        // First get basic profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, create it
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              user_id: session.user.id,
              email: session.user.email || "",
              is_admin: false,
              is_active: true,
            })
            .select()
            .single();
          
          if (!newProfile?.is_admin) {
            toast({
              title: "Access Denied",
              description: "You don't have admin privileges.",
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }
          setProfile(newProfile);
        } else {
          if (!profileData?.is_admin) {
            toast({
              title: "Access Denied",
              description: "You don't have admin privileges.",
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }
          setProfile(profileData);
        }
        await loadData();
      } catch (err: any) {
        console.error("Auth error:", err);
        toast({
          title: "Error",
          description: err.message || "Failed to load admin dashboard",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const loadData = async () => {
    await Promise.all([
      loadUsers(),
      loadStats(),
      loadSettings(),
    ]);
  };

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "getAllUsers" },
      });

      if (error) throw error;

      if (data?.success) {
        setUsers(data.data || []);
      }
    } catch (err: any) {
      console.error("Error loading users:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "getStats" },
      });

      if (error) throw error;

      if (data?.success) {
        setStats(data.data || {});
      }
    } catch (err: any) {
      console.error("Error loading stats:", err);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "getSettings" },
      });

      if (error) throw error;

      if (data?.success) {
        const settingsMap: any = {};
        (data.data || []).forEach((s: any) => {
          settingsMap[s.setting_key] = s.setting_value;
        });
        setSettings(settingsMap);
      }
    } catch (err: any) {
      console.error("Error loading settings:", err);
    }
  };

  const updateUserSubscription = async (userId: string, plan: string, expiresAt?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "updateUserSubscription",
          userId,
          plan,
          expiresAt,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: "User subscription updated successfully",
        });
        await loadUsers();
        await loadStats();
      } else {
        throw new Error(data?.error || "Failed to update subscription");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update subscription",
        variant: "destructive",
      });
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "toggleUserActive",
          userId,
          isActive,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: `User ${isActive ? "activated" : "deactivated"}`,
        });
        await loadUsers();
      } else {
        throw new Error(data?.error || "Failed to update user status");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "updateSetting",
          key,
          value,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: "Setting updated successfully",
        });
        await loadSettings();
      } else {
        throw new Error(data?.error || "Failed to update setting");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users, settings, and platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers || 0}</div>
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Registered</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trial Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.trialUsers || 0}</div>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Active Trials</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Brokers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeBrokers || 0}</div>
              <div className="flex items-center gap-2 mt-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTrades || 0}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">All Time</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Platform Settings</TabsTrigger>
            <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts, subscriptions, and trial periods</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.full_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.subscription_plan === "trial" ? "secondary" : "default"}>
                            {u.subscription_plan || "trial"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.is_active ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{u.is_active ? "Active" : "Inactive"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={u.subscription_plan || "trial"}
                              onValueChange={(value) => {
                                const expiresAt = value === "trial" 
                                  ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                                  : null;
                                updateUserSubscription(u.user_id, value, expiresAt);
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                            <Switch
                              checked={u.is_active}
                              onCheckedChange={(checked) => toggleUserActive(u.user_id, checked)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Trial Duration (Days)</Label>
                  <Input
                    type="number"
                    value={settings.trial_duration_days || 7}
                    onChange={(e) => updateSetting("trial_duration_days", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Trial Users</Label>
                  <Input
                    type="number"
                    value={settings.max_trial_users || 100}
                    onChange={(e) => updateSetting("max_trial_users", e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Platform Enabled</Label>
                    <p className="text-sm text-muted-foreground">Enable/disable platform access</p>
                  </div>
                  <Switch
                    checked={settings.platform_enabled === "true" || settings.platform_enabled === true}
                    onCheckedChange={(checked) => updateSetting("platform_enabled", checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put platform in maintenance mode</p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode === "true" || settings.maintenance_mode === true}
                    onCheckedChange={(checked) => updateSetting("maintenance_mode", checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Execute Enabled</Label>
                    <p className="text-sm text-muted-foreground">Enable auto-execute feature globally</p>
                  </div>
                  <Switch
                    checked={settings.auto_execute_enabled === "true" || settings.auto_execute_enabled === true}
                    onCheckedChange={(checked) => updateSetting("auto_execute_enabled", checked.toString())}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Strategies Per User</Label>
                  <Input
                    type="number"
                    value={settings.max_strategies_per_user || 5}
                    onChange={(e) => updateSetting("max_strategies_per_user", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Monitoring</CardTitle>
                <CardDescription>Monitor platform health and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Users</Label>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <div>
                      <Label>Active Brokers</Label>
                      <p className="text-2xl font-bold">{stats.activeBrokers}</p>
                    </div>
                    <div>
                      <Label>Total Trades</Label>
                      <p className="text-2xl font-bold">{stats.totalTrades}</p>
                    </div>
                    <div>
                      <Label>Trial Users</Label>
                      <p className="text-2xl font-bold">{stats.trialUsers}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

