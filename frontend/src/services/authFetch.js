// import API_BASE_URL from "./api";

// export async function authFetch(endpoint, options = {}) {
//   const token = localStorage.getItem("token");

//   const response = await fetch(`${API_BASE_URL}${endpoint}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//       ...(options.headers || {})
//     }
//   });

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || "Request failed");
//   }

//   return data;
// }


import API_BASE_URL from "./api";

export async function authFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "object"
        ? data.message || "Request failed"
        : data || "Request failed"
    );
  }

  return data;
}