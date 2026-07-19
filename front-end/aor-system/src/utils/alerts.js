import Swal from "sweetalert2";

export const successAlert = async (title, text) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
  });
};

export const errorAlert = async (title, text) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
  });
};

export const warningAlert = async (title, text) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
  });
};

export const confirmAlert = async (title, text) => {
  return Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  });
};

export const promptAlert = async (
  title,
  label,
  placeholder = "",
  input = "text"
) => {
  return Swal.fire({
    title,
    input,
     customClass: {
      input: "swal-input",
    },
    inputLabel: label,
    showCancelButton: true,
    confirmButtonText: "Submit",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#126312",
    cancelButtonColor: "#6c757d",
    inputValidator: (value) => {
      if (!value) {
        return "This field is required.";
      }
    },
  });
};