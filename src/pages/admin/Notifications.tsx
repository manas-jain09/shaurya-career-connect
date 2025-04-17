
import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, CheckCircle, XCircle, FileText, UserCheck, Calendar } from 'lucide-react';
import { Notification } from '@/types/database.types';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const Notifications = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = selectedFilter === 'all'
    ? notifications
    : notifications.filter(notification => !notification.is_read);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('Verification')) return <FileText size={18} className="text-blue-500" />;
    if (title.includes('Updated')) return <CheckCircle size={18} className="text-green-500" />;
    if (title.includes('Rejected')) return <XCircle size={18} className="text-red-500" />;
    if (title.includes('Profile')) return <UserCheck size={18} className="text-purple-500" />;
    return <Bell size={18} className="text-gray-500" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600">View and manage your notifications</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={selectedFilter === 'all' ? 'bg-shaurya-light' : ''}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={selectedFilter === 'unread' ? 'bg-shaurya-light' : ''}
              onClick={() => setSelectedFilter('unread')}
            >
              Unread
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={!notifications.some(n => !n.is_read)}
            >
              <Check size={16} className="mr-1" /> Mark All Read
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredNotifications.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {filteredNotifications.map((notification: Notification) => (
                      <li 
                        key={notification.id} 
                        className={`p-4 flex items-start gap-3 ${!notification.is_read ? 'bg-shaurya-light/10' : ''}`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {getNotificationIcon(notification.title)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900 flex items-center">
                              {notification.title}
                              {!notification.is_read && (
                                <Badge className="ml-2 bg-blue-500">New</Badge>
                              )}
                            </h3>
                            {notification.created_at && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Calendar size={12} className="mr-1" />
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          {!notification.is_read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 text-xs" 
                              onClick={() => handleMarkAsRead(notification.id as string)}
                            >
                              <Check size={14} className="mr-1" /> Mark as read
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell size={40} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No notifications</h3>
                  <p className="text-gray-500 mt-1">
                    {selectedFilter === 'unread' 
                      ? 'You have read all notifications' 
                      : 'You don\'t have any notifications yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Notifications;
