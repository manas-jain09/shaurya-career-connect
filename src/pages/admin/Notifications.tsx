
import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Check,
  Bell,
  Clock,
  CheckCheck,
  FileCheck,
  UserCog,
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshData,
  } = useNotifications();

  const [selectedTab, setSelectedTab] = useState('all');

  const filteredNotifications = selectedTab === 'all'
    ? notifications
    : selectedTab === 'unread'
      ? notifications.filter(notification => !notification.is_read)
      : notifications.filter(notification => notification.is_read);

  const getNotificationIcon = (title: string) => {
    if (title.includes('Verification')) return FileCheck;
    if (title.includes('Profile')) return UserCog;
    return Bell;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-600">
              View and manage your notifications
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              <Clock size={16} className="mr-2" /> Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading}
              >
                <CheckCheck size={16} className="mr-2" /> Mark All as Read
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full md:w-96 grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoading}
              markAsRead={markAsRead}
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-4">
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoading}
              markAsRead={markAsRead}
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>

          <TabsContent value="read" className="mt-4">
            <NotificationList
              notifications={filteredNotifications}
              isLoading={isLoading}
              markAsRead={markAsRead}
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

interface NotificationListProps {
  notifications: any[];
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  getNotificationIcon: (title: string) => React.ElementType;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
  markAsRead,
  getNotificationIcon,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No notifications found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const NotificationIcon = getNotificationIcon(notification.title);
        return (
          <Card
            key={notification.id}
            className={`transition-colors ${!notification.is_read ? 'bg-blue-50 border-blue-100' : ''}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${!notification.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <NotificationIcon
                      size={18}
                      className={!notification.is_read ? 'text-blue-600' : 'text-gray-500'}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">{notification.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {format(new Date(notification.created_at), 'MMM dd, yyyy • HH:mm')}
                    </CardDescription>
                  </div>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(notification.id)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Check size={16} className="mr-1" /> Mark as read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{notification.message}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Notifications;
