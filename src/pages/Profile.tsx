import { useState, useEffect } from 'react';
import { User, Package, CreditCard, LogOut, Edit, Save, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';

interface UserPerfil {
  id: string;
  username: string;
  full_name: string | null;
  address: string | null;
  phone: string | null;
}

export default function Perfil() {
  const { user, profile, setPerfil, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    address: '',
    phone: '',
  });
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    async function fetchPerfil() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setPerfil(data as UserPerfil);
          setFormData({
            username: data?.username || '',
            full_name: data?.full_name || '',
            address: data?.address || '',
            phone: data?.phone || '',
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfil();
  }, [user, setPerfil]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear username error when user types
    if (name === 'username') {
      setUsernameError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate username
    if (!formData.username.trim()) {
      setUsernameError('Username is required');
      return;
    }
    
    try {
      // Check if username is already taken (but not by current user)
      if (formData.username !== profile?.username) {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', user.id)
          .limit(1);
          
        if (checkError) {
          console.error('Error checking username:', checkError);
          return;
        }
        
        if (existingUsers && existingUsers.length > 0) {
          setUsernameError('Username is already taken. Please choose another one.');
          return;
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          full_name: formData.full_name,
          address: formData.address,
          phone: formData.phone,
        });

      if (error) {
        console.error('Error updating profile:', error);
      } else {
        setPerfil({
          id: user.id,
          username: formData.username,
          full_name: formData.full_name,
          address: formData.address,
          phone: formData.phone,
        } as UserPerfil);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <AuthGuard>
      <section className="container py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Mi perfil
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-primary/10 rounded-full p-4 mb-4">
                  <User className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile?.username || user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {user?.email}
                </p>
              </div>
              
              <nav className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                  <span>Perfil</span>
                </button>
                <button 
                  onClick={() => navigate('/orders')}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Package className="h-5 w-5" />
                  <span>Pedidos</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Methods</span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar sesion</span>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 text-primary hover:text-gray-300"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setUsernameError('');
                      // Reiniciar form data to current profile
                      if (profile) {
                        setFormData({
                          username: profile.username || '',
                          full_name: profile.full_name || '',
                          address: profile.address || '',
                          phone: profile.phone || '',
                        });
                      }
                    }}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2 rounded-lg border ${
                        usernameError ? 'border-purple-500 dark:border-purple-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    {usernameError && (
                      <p className="mt-1 text-sm text-purple-500">{usernameError}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-white hover:text-black transition-colors btn-hover-scale"
                  >
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Username
                    </h3>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {profile?.username || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </h3>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {profile?.full_name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email Address
                    </h3>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {user?.email}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone Number
                    </h3>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {profile?.phone || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Address
                    </h3>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {profile?.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Account Security
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-medium">Password</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Last changed: Never
                    </p>
                  </div>
                  <button className="text-primary hover:text-gray-300 transition-colors link-hover">
                    Change Password
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-medium">Two-Factor Authentication</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Not enabled
                    </p>
                  </div>
                  <button className="text-primary hover:text-gray-300 transition-colors link-hover">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}


