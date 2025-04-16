
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/database.types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotifications = (): NotificationData => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previousNotifications, setPreviousNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Type-cast the data
      const typedNotifications: Notification[] = data || [];
      
      // Check for new notifications and show toasts
      if (previousNotifications.length > 0) {
        const prevIds = new Set(previousNotifications.map(n => n.id));
        const newNotifications = typedNotifications.filter(n => !prevIds.has(n.id as string));
        
        newNotifications.forEach(notification => {
          toast(notification.title, {
            description: notification.message,
          });
        });
      }
      
      setPreviousNotifications(typedNotifications);
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Update local state
      const updatedNotifications = notifications.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification');
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) throw updateError;
      
      // Update local state
      const updatedNotifications = notifications.map(notification => 
        ({ ...notification, is_read: true })
      );
      
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update notifications');
      throw err;
    }
  };

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          // Show toast for the new notification
          const notification = payload.new as Notification;
          toast(notification.title, {
            description: notification.message,
          });
          
          // Refresh notifications to include the new one
          fetchNotifications();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch of notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshData: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};
