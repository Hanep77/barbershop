import React, { useEffect } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';
import echo from '../../lib/echo';
import { 
    Bell, 
    CheckCircle2, 
    CalendarCheck2, 
    AlertCircle, 
    Check
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
    const { 
        notifications, 
        unreadCount, 
        fetchNotifications, 
        fetchUnreadCount, 
        markAsRead, 
        markAllAsRead,
        addNotification
    } = useNotificationStore();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchUnreadCount();

            const channel = echo.private(`notifications.${user.id}`)
                .listen('.notification.sent', (e: any) => {
                    console.log('Real-time notification received:', e);
                    addNotification(e.notification);
                });

            return () => {
                channel.stopListening('.notification.sent');
            };
        }
    }, [user, fetchNotifications, fetchUnreadCount, addNotification]);

    const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markAsRead(notificationId);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking_created':
                return <CalendarCheck2 className="h-4 w-4 text-blue-500" />;
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-4 pb-2">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-auto p-0 hover:bg-transparent text-blue-500"
                        onClick={() => markAllAsRead()}
                    >
                        Mark all as read
                    </Button>
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem 
                                key={notification.id} 
                                className={`p-4 cursor-default focus:bg-accent flex flex-col items-start gap-1 border-b last:border-0 ${!notification.is_read ? 'bg-muted/30' : ''}`}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {getIcon(notification.type)}
                                        <span className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                                            {notification.title}
                                        </span>
                                    </div>
                                    {!notification.is_read && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 p-0"
                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;

