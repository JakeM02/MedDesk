document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutButton = document.getElementById('logoutButton');

   // Login functionality
   if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Get the username and password from the input fields
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Prepare the payload for the POST request
        const payload = {
            username: username,
            password: password
        };

        // Send the POST request to Flask server
        fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)  // Send credentials as JSON
        })
        .then(response => response.json())  // Parse JSON response
        .then(data => {
            // Check if login was successful
            if (data.message) {
                // Store user information 
                localStorage.setItem('userId', data.username);
                localStorage.setItem('isAdmin', data.is_admin);
                window.location.href = data.redirect_url; // Redirect to dashboard on successful login
            } else {
                // If login failed, show error message
                loginError.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loginError.style.display = 'block';  // Show error message if request fails
        });
    });
}

//log out
if (logoutButton) {
    logoutButton.addEventListener('click', function () {
        fetch('/api/logout', {
            method: 'POST',  // Use POST method to trigger the Flask route
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            // On successful logout, remove token and redirect to the login page
            localStorage.removeItem("token");
            window.location.href = '/';  //  login page
        })
        .catch(error => {
            console.error('Logout failed:', error);
            alert('Failed to log out. Please try again.');
        });
    });
  }
})
