document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutButton = document.getElementById('logoutButton');
    const createTicketButton = document.getElementById('createTicketButton');
    const saveTicketButton = document.getElementById('saveTicketButton');
    const ticketList = document.getElementById('ticketList');
    const navbar = document.getElementById('navbar');

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

            // Send the POST request to the Flask server
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
                    localStorage.setItem('userId', data.user_id);
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
            fetch('/logout', {
                method: 'POST',  // Use POST method to trigger the Flask route
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                // On successful logout, redirect to the login page
                window.location.href = '/';  //  login page
            })
            .catch(error => {
                console.error('Logout failed:', error);
                alert('Failed to log out. Please try again.');
            });
        });
    }
    

    // Dark mode functionality
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        navbar.classList.add('bg-dark', 'navbar-dark');
        navbar.classList.remove('bg-light');
        document.querySelectorAll('.ticket-box, .modal').forEach(el => el.classList.add('dark-mode'));
        localStorage.setItem('darkMode', 'enabled');
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        navbar.classList.remove('bg-dark', 'navbar-dark');
        navbar.classList.add('bg-light');
        document.querySelectorAll('.ticket-box, .modal').forEach(el => el.classList.remove('dark-mode'));
        localStorage.setItem('darkMode', 'disabled');
    }

    if (darkModeToggle) {
        if (localStorage.getItem('darkMode') === 'enabled') {
            enableDarkMode();
        }

        darkModeToggle.addEventListener('click', function () {
            if (document.body.classList.contains('dark-mode')) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        });
    }

    // modal for creating new users as admin
    document.getElementById('registerUserBtn').addEventListener('click', function() {
        // Show the modal when the button is clicked
        $('#userModal').modal('show');
    });

    // Handle form submission for user registration
    document.getElementById('registerUserForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Get the form data
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Ensure the username and password fields are not empty
        if (username && password) {
            const userId = 1;  // Admin ID
            
            // Prepare the data to send to the backend
            const userData = {
                username: username,
                password: password
            };

            console.log('User Data:', userData); // Debugging

            // Send the data to the backend using fetch
            fetch('http://127.0.0.1:5000/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId,
                },
                body: JSON.stringify(userData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Response Data:', data); // Debugging

                if (data.message) {
                    alert('User registered successfully');
                    $('#userModal').modal('hide'); // Close the modal
                } else if (data.error) {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while registering the user.');
            });
        } else {
            alert('Please fill in both fields.');
        }
    });


    // Display active tickets
    function displayActiveTickets() {
        ticketList.innerHTML = ''; // Clear existing tickets

        // Fetch the active tickets (archived = false)
        fetch('http://127.0.0.1:5000/api/tickets')
            .then(response => response.json())
            .then(tickets => {
                const activeTickets = tickets.filter(ticket => !ticket.archived); // Filter for active tickets
                if (activeTickets.length === 0) {
                    ticketList.innerHTML = '<p>No active tickets available.</p>';
                    return;
                }

                // Loop through the active tickets and display them
                activeTickets.forEach(ticket => {
                    const ticketDiv = document.createElement('div');
                    ticketDiv.className = 'ticket-box col-md-4';
                    ticketDiv.innerHTML = `
                        <h5>Ticket #${ticket.id}: ${ticket.title}</h5>
                        <p>Employee: ${ticket.employee}</p>
                        <p><strong>Priority:</strong> <span class="priority-badge">${ticket.priority}</span></p>
                    `;
                    ticketDiv.addEventListener('click', () => openTicketFromActive(ticket));
                    ticketList.appendChild(ticketDiv);

                    // Apply dark mode styling if it's enabled
                    if (document.body.classList.contains('dark-mode')) {
                        ticketDiv.classList.add('dark-mode');
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching active tickets:', error);
            });
    }

    // Function to archive a ticket
    function archiveTicket(ticket) {
        fetch(`http://127.0.0.1:5000/api/tickets/${ticket.id}/archive`, {
            method: 'POST'  // Use POST to archive the ticket
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to archive ticket');
            }
            return response.json();
        })
        .then(data => {
            alert('Ticket archived successfully!');
            displayActiveTickets(); // Refresh the active ticket list to remove the archived ticket
        })
        .catch(error => {
            console.error('Error archiving ticket:', error);
            alert('An error occurred while archiving the ticket. Please try again.');
        });
    }

    // Open ticket details in a modal (for active tickets)
    function openTicketFromActive(ticket) {
        const ticketDetailsContent = document.getElementById('ticketDetailsContent');
        const ticketDetailsModalLabel = document.getElementById('ticketDetailsModalLabel');
        ticketDetailsModalLabel.innerHTML = `<p>Ticket #${ticket.id}: ${ticket.title}</p>`;
        ticketDetailsContent.innerHTML = `
            <p><strong>Employee:</strong> ${ticket.employee}</p>
            <p><strong>Email:</strong> ${ticket.email}</p>
            <p><strong>Location:</strong> ${ticket.location || 'N/A'}</p>
            <p><strong>Staff Number:</strong> ${ticket.staff_number || 'N/A'}</p>
            <p><strong>Phone Number:</strong> ${ticket.phone_number || 'N/A'}</p>
            <p><strong>Priority:</strong> ${ticket.priority || 'N/A'}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
        `;

        // Initialize and show the modal
        const modal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
        modal.show();

        // Show the "Archive Ticket" button for active tickets
        const archiveButton = document.getElementById('archiveTicketButton');
        archiveButton.style.display = 'block'; // Make sure the button is visible
        archiveButton.innerText = 'Archive Ticket'; // Set button text for archiving

        // Archive ticket when the button is clicked
        archiveButton.onclick = function () {
            archiveTicket(ticket); // Call the function to archive the ticket

            // Close the modal after archiving
            const modalElement = document.getElementById('ticketDetailsModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement); // Get the modal instance
            modalInstance.hide();
        };

        // Apply dark mode styling for the modal dynamically
        const modalContent = document.getElementById('ticketDetailsModalContent');
        if (document.body.classList.contains('dark-mode')) {
            modalContent.classList.add('dark-mode');
        } else {
            modalContent.classList.remove('dark-mode');
        }
    }

    // Ticket creation functionality
    if (createTicketButton && saveTicketButton) {
        createTicketButton.addEventListener('click', function () {
            const modal = new bootstrap.Modal(document.getElementById('createTicketModal'));
            modal.show();
        });

        saveTicketButton.addEventListener('click', function () {
            const userName = document.getElementById('userName').value;
            const staffNumber = document.getElementById('staffNumber').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const location = document.getElementById('location').value;
            const issueTitle = document.getElementById('issueTitle').value;
            const issueDescription = document.getElementById('issueDescription').value;
            const userEmail = document.getElementById('userEmail').value;
            const priority = document.getElementById('priority').value;

            if (userName && staffNumber && phoneNumber && location && issueTitle && issueDescription && userEmail && priority) {
                const newTicket = {
                    employee: userName,
                    staff_number: staffNumber,
                    phone_number: phoneNumber,
                    location: location,
                    title: issueTitle,
                    description: issueDescription,
                    email: userEmail,
                    priority: priority
                };
        
                // Send the new ticket to the backend using POST
                fetch('http://127.0.0.1:5000/api/tickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newTicket)
                })
                .then(response => response.json())
                .then(data => {
                    // Refresh the tickets list after adding the new ticket
                    displayActiveTickets();
        
                    // Hide the modal after successful creation
                    const modal = bootstrap.Modal.getInstance(document.getElementById('createTicketModal'));
                    modal.hide();
        
                    // Reset the form
                    document.getElementById('ticketForm').reset();
                })
                .catch(error => {
                    console.error('Error adding ticket:', error);
                });
            } else {
                alert('Please fill in all fields.');
            }
        });
    }

    //listener for  staffnumber
    document.getElementById('staffNumber').addEventListener('blur', function () {
        const staffNumber = this.value;
        fetch(`/api/employees/${staffNumber}`)
            .then(response => response.json())
            .then(data => {
                if (data.name) {
                    document.getElementById('userName').value = data.name;
                    document.getElementById('userEmail').value = data.email;
                    document.getElementById('phoneNumber').value = data.phone_number;
                    document.getElementById('location').value = data.location;
                } else {
                    alert('Employee not found!');
                }
            })
            .catch(error => console.error('Error fetching employee info:', error));
    });

    // Initial display of active tickets (on page load)
    if (ticketList) {
        displayActiveTickets();
    }
});
