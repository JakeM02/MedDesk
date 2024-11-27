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
        const validUsername = 'admin';
        const validPassword = 'password';

        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === validUsername && password === validPassword) {
                window.location.href = 'dashboard.html'; // Redirect to dashboard on successful login
            } else {
                loginError.style.display = 'block'; // Show login error message
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            window.location.href = 'login.html';  // Redirect to login page
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

    // Open ticket details in a modal (for active tickets)
    function openTicketFromActive(ticket) {
        const ticketDetailsContent = document.getElementById('ticketDetailsContent');
        ticketDetailsContent.innerHTML = `
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Employee:</strong> ${ticket.employee}</p>
            <p><strong>Location:</strong> ${ticket.location || 'N/A'}</p>
            <p><strong>Staff Number:</strong> ${ticket.staff_number || 'N/A'}</p>
            <p><strong>Phone Number:</strong> ${ticket.phone_number || 'N/A'}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
        `;
        
        // Initialize the modal and show it
        const modal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
        modal.show();
    
        const archiveButton = document.getElementById('archiveTicketButton');
        archiveButton.style.display = 'block'; // Ensure the button is visible
        archiveButton.innerText = 'Archive Ticket'; // Action is to archive the ticket
        
        // Archive button action for active ticket
        archiveButton.onclick = function () {
            toggleArchiveStatus(ticket); // Archive the ticket
    
            // Close the modal after the action
            const modalElement = document.getElementById('ticketDetailsModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement); // Get the modal instance
            modalInstance.hide();
        };
    
        // Apply dark mode styling for modal dynamically
        if (document.body.classList.contains('dark-mode')) {
            document.getElementById('ticketDetailsModalContent').classList.add('dark-mode');
        } else {
            document.getElementById('ticketDetailsModalContent').classList.remove('dark-mode');
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
        
            if (userName && staffNumber && phoneNumber && location && issueTitle && issueDescription) {
                const newTicket = {
                    employee: userName,
                    staff_number: staffNumber,
                    phone_number: phoneNumber,
                    location: location,
                    title: issueTitle,
                    description: issueDescription
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

    // Initial display of active tickets (on page load)
    if (ticketList) {
        displayActiveTickets();
    }
});
