// Utility function to extract user-readable error messages from API errors

/**
 * Extracts a user-readable error message from an API error response
 * Handles validation errors, simple messages, and fallback to generic messages
 * 
 * @param error - The error object from API call
 * @param defaultMessage - Default message to show if no readable error found
 * @returns User-readable error message
 */
export function extractErrorMessage(error: any, defaultMessage: string = "An error occurred"): string {
  // If error is already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // Try to get error from response data
  const errorData = error?.response?.data || error?.data || error;

  // Check for validation errors (ASP.NET Core format)
  if (errorData?.errors && typeof errorData.errors === "object") {
    const validationErrors: string[] = [];
    
    // Extract all validation error messages
    Object.keys(errorData.errors).forEach((field) => {
      const fieldErrors = errorData.errors[field];
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        // Add field name and error message
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1");
        fieldErrors.forEach((msg: string) => {
          validationErrors.push(`${fieldName}: ${msg}`);
        });
      }
    });

    if (validationErrors.length > 0) {
      // Return first validation error (most relevant)
      // If multiple errors, show first one to keep it concise
      return validationErrors[0];
    }
  }

  // Check for simple message field
  if (errorData?.message && typeof errorData.message === "string") {
    const message = errorData.message.trim();
    // Only return if it's user-readable (not technical error messages)
    if (message && !message.includes("System.") && !message.includes("Exception")) {
      return message;
    }
  }

  // Check for title field (ASP.NET Core validation error format)
  if (errorData?.title && typeof errorData.title === "string") {
    const title = errorData.title.trim();
    if (title && title !== "One or more validation errors occurred.") {
      return title;
    }
  }

  // Check error message directly
  if (error?.message && typeof error.message === "string") {
    const message = error.message.trim();
    if (message && !message.includes("System.") && !message.includes("Exception")) {
      return message;
    }
  }

  // Fallback to default message
  return defaultMessage;
}
