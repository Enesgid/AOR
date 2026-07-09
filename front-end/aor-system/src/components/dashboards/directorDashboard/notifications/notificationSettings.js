export const canNotifyHod = () =>
  JSON.parse(
    localStorage.getItem(
      "hodNotifications"
    )
  );

export const canNotifyDean = () =>
  JSON.parse(
    localStorage.getItem(
      "deanNotifications"
    )
  );

export const canNotifyLecturer =
  () =>
    JSON.parse(
      localStorage.getItem(
        "lecturerNotifications"
      )
    );