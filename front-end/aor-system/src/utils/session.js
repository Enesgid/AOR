export const getCurrentToken = () => {
  const portal = sessionStorage.getItem("currentPortal");

  if (portal === "lecturer") {
    return localStorage.getItem("lecturerToken");
  }

  if (portal === "admin") {
    return localStorage.getItem("adminToken");
  }

  return null;
};

export const getCurrentUser = () => {
  const portal = sessionStorage.getItem("currentPortal");

  if (portal === "lecturer") {
    return JSON.parse(localStorage.getItem("lecturerUser"));
  }

  if (portal === "admin") {
    return JSON.parse(localStorage.getItem("adminUser"));
  }

  return null;
};