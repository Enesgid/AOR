export const getNotifications = () => {
  return (
    JSON.parse(
      localStorage.getItem("notifications")
    ) || []
  );
};

export const addNotification = (
  message,
  type = "info"
) => {
  const notifications =
    getNotifications();

  const newNotification = {
    id: Date.now(),
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(
    newNotification
  );

  localStorage.setItem(
    "notifications",
    JSON.stringify(notifications)
  );
};

export const markAsRead = (id) => {
  const notifications =
    getNotifications();

  const updated =
    notifications.map((item) =>
      item.id === id
        ? { ...item, read: true }
        : item
    );

  localStorage.setItem(
    "notifications",
    JSON.stringify(updated)
  );
};

export const clearNotifications =
  () => {
    localStorage.removeItem(
      "notifications"
    );
  };