import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, LogOut, User, Save } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function Account() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address, city, state, pincode')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Check if profile exists, update or upsert
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          Loading your account…
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-serif font-bold mb-10"
        >
          My Account
        </motion.h1>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Navigation Card */}
          <div className="bg-card rounded-xl shadow-card p-6 space-y-3 h-fit border border-border">
            <Link
              to="/orders"
              className="flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors"
            >
              <Package className="h-4 w-4 text-muted-foreground" />
              My Orders
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-sm text-red-600 hover:text-red-700 hover:underline transition-colors w-full text-left pt-2 border-t border-border"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {/* Right Profile Information Form */}
          <div className="md:col-span-2 bg-card rounded-xl shadow-card p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Profile Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="text-sm font-medium mb-1.5 block">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium mb-1.5 block">
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  placeholder="House / Street / Landmark"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-medium mb-1.5 block">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={profile.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>

              <div>
                <Label htmlFor="state" className="text-sm font-medium mb-1.5 block">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={profile.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>

              <div>
                <Label htmlFor="pincode" className="text-sm font-medium mb-1.5 block">
                  Pincode
                </Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={profile.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                />
              </div>
            </div>

            <Button
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
