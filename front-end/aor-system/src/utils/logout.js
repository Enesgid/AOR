export const logoutCurrentPortal = () => {
  const portal = sessionStorage.getItem("currentPortal");

  if (portal === "lecturer") {
    localStorage.removeItem("lecturerToken");
    localStorage.removeItem("lecturerUser");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("aorDraft_")) {
        localStorage.removeItem(key);
      }
    });
  }

  if (portal === "admin") {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  }

  sessionStorage.removeItem("currentPortal");
};