import { useNavigate } from "react-router-dom";
import { useUserNotifications, UserNotification } from "@/hooks/useUserNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  BellDot,
  Check,
  CheckCheck,
  Trash2,
  Stethoscope,
  FlaskConical,
  Heart,
  FileText,
  ShoppingCart,
  Clock,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<any>> = {
  Stethoscope,
  FlaskConical,
  Heart,
  FileText,
  ShoppingCart,
  Bell,
  Clock,
};

const typeColorMap: Record<string, string> = {
  booking_confirmed: "bg-emerald-100 text-emerald-700",
  nurse_confirmed: "bg-rose-100 text-rose-700",
  prescription_approved: "bg-blue-100 text-blue-700",
  appointment_cancelled: "bg-red-100 text-red-700",
  info: "bg-primary/10 text-primary",
};

const NotificationPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useUserNotifications();

  if (!user) return null;

  const handleNotificationClick = (notif: UserNotification) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.navigate_to) {
      navigate(notif.navigate_to);
      setOpen(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    const Icon = iconMap[iconName || "Bell"] || Bell;
    return Icon;
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          {unreadCount > 0 ? (
            <BellDot className="w-5 h-5 text-primary" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-[10px] h-6 px-2 text-primary"
                title="Mark all as read"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-[10px] h-6 px-2 text-muted-foreground"
                title="Clear all"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You'll see booking confirmations here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = getIcon(notif.icon);
                const colorClass =
                  typeColorMap[notif.type] || typeColorMap.info;

                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notif.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-tight ${
                            !notif.is_read
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {getTimeAgo(notif.created_at)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-primary"
              onClick={() => {
                navigate("/my-bookings");
                setOpen(false);
              }}
            >
              View All Bookings
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;
