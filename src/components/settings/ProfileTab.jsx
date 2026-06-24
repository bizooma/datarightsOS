import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Check, Upload, Lock, Trash2, Loader2 } from 'lucide-react';

export default function ProfileTab({ user }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [canceling, setCanceling] = useState(false);

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    await base44.auth.updateMe({ full_name: fullName, avatar_url: avatarUrl });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
    toast({ title: 'Profile saved', description: 'Your profile has been updated.' });
    setSaving(false);
  }

  async function handlePasswordReset() {
    setSendingReset(true);
    await base44.auth.resetPasswordRequest(user.email);
    toast({ title: 'Reset email sent', description: `Check ${user.email} for a link to change your password.` });
    setSendingReset(false);
  }

  async function handleCancelAccount() {
    setCanceling(true);
    await base44.auth.logout();
  }

  const initials = (fullName || user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Profile</CardTitle>
          <CardDescription className="text-xs">Your name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt="Profile" />
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <label className="flex items-center gap-2 cursor-pointer h-9 px-3 rounded-md border border-border bg-white text-sm text-muted-foreground hover:bg-muted/40 transition-colors">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : avatarUrl ? 'Replace photo' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
            <Input value={user?.email || ''} disabled className="h-9 text-sm bg-muted/40" />
          </div>
          <Button size="sm" className="h-9 text-sm" onClick={handleSave} disabled={saving || uploading}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Password</CardTitle>
          <CardDescription className="text-xs">We'll email you a secure link to set a new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" variant="outline" className="h-9 text-sm gap-1.5" onClick={handlePasswordReset} disabled={sendingReset}>
            {sendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-destructive">Cancel Account</CardTitle>
          <CardDescription className="text-xs">Sign out and stop using your account. Contact support to permanently delete your data.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-9 text-sm gap-1.5 border-destructive text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
                Cancel Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out immediately. To permanently delete your account and data,
                  email <a href="mailto:support@datarightsos.com" className="underline">support@datarightsos.com</a>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Account</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelAccount} disabled={canceling} className="bg-destructive hover:bg-destructive/90">
                  {canceling ? 'Signing out…' : 'Cancel Account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}