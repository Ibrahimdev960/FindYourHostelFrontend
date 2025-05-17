// Dynamically set the BASE_URL based on the environment
export const BASE_URL ='http://192.168.196.6:5001/api'

// Function to register a user
export const registerUser = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // this should include phone
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Registration failed');
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

