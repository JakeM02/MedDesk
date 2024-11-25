document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutButton = document.getElementById('logoutButton');
    const createTicketButton = document.getElementById('createTicketButton');
    const saveTicketButton = document.getElementById('saveTicketButton');
    const ticketList = document.getElementById('ticketList');
    const navbar = document.getElementById('navbar'); 

    const tickets = [
        { id: 1, title: 'Computer Issue', employee: 'John Doe', description: 'PC not turning on' },
        { id: 2, title: 'Printer Malfunction', employee: 'Jane Smith', description: 'Printer jammed' },
        { id: 3, title: 'Network Issue', employee: 'Alice Brown', description: 'WiFi connectivity problems' }
    ];

    // Login functionality
    if (loginForm) {
        const validUsername = 'admin';
        const validPassword = 'password';

        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === validUsername && password === validPassword) {
                window.location.href = 'dashboard.html';
            } else {
                loginError.style.display = 'block';
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

    // Display tickets
    function displayTickets() {
        ticketList.innerHTML = ''; // Clear existing tickets

        fetch('http://127.0.0.1:5000/api/tickets')
        .then(response => response.json())
        .then(tickets => {
            tickets.forEach(ticket => {
                const ticketDiv = document.createElement('div');
                ticketDiv.className = 'ticket-box col-md-4';
                ticketDiv.innerHTML = `
                    <h5>Ticket #${ticket.id}: ${ticket.title}</h5>
                    <p>Employee: ${ticket.employee}</p>
                `;
                ticketDiv.addEventListener('click', () => openTicket(ticket));
                ticketList.appendChild(ticketDiv);

                // Apply dark mode styling for new tickets
                if (document.body.classList.contains('dark-mode')) {
                    ticketDiv.classList.add('dark-mode');
                }
            });
        })
        .catch(error => {
            console.error('Error fetching tickets:', error);           
        });
}

    // Open ticket details in a modal
    function openTicket(ticket) {
        const ticketDetailsContent = document.getElementById('ticketDetailsContent');
        ticketDetailsContent.innerHTML = `
            <p><strong>Title:</strong> ${ticket.title}</p>
            <p><strong>Employee:</strong> ${ticket.employee}</p>
            <p><strong>Location:</strong> ${ticket.location || 'N/A'}</p>
            <p><strong>Staff Number:</strong> ${ticket.staffNumber || 'N/A'}</p>
            <p><strong>Phone Number:</strong> ${ticket.phoneNumber || 'N/A'}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
        `;
        const modal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
        modal.show();

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
                    displayTickets();
        
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

    // Initial display of tickets
    if (ticketList) {
        displayTickets();
    }
});
