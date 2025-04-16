document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const ticketList = document.getElementById('ticketList');
    const logoutButton = document.getElementById('logoutButton');
    const navbar = document.getElementById('navbar');

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

    // Toggle Dark Mode
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

    // Display archived tickets
    function displayArchivedTickets() {
        ticketList.innerHTML = ''; // Clear existing tickets

        // Fetch the archived tickets (archived = true)
        fetch('/api/tickets/archived')
            .then(response => response.json())
            .then(tickets => {
                if (tickets.length === 0) {
                    ticketList.innerHTML = '<p>No archived tickets available.</p>';
                    return; // Exit early if no archived tickets are available
                }

                // Loop through the tickets and display them
                tickets.forEach(ticket => {
                    const ticketDiv = document.createElement('div');
                    ticketDiv.className = 'ticket-box col-md-4';
                    ticketDiv.innerHTML = `
                        <h5>Ticket #${ticket.id}: ${ticket.title}</h5>
                        <p>Employee: ${ticket.employee}</p>
                        <p><strong>Priority:</strong> <span class="priority-badge">${ticket.priority}</span></p>
                    `;
                    ticketDiv.addEventListener('click', () => openTicketFromArchive(ticket));
                    ticketList.appendChild(ticketDiv);

                    // Apply dark mode styling if it's enabled
                    if (document.body.classList.contains('dark-mode')) {
                        ticketDiv.classList.add('dark-mode');
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching archived tickets:', error);
            });
    }

    // Open ticket details in a modal
    function openTicketFromArchive(ticket) {
        const ticketDetailsContent = document.getElementById('ticketDetailsContent');
        ticketDetailsContent.innerHTML = '';  // Clear previous details

        fetch(`/api/tickets/${ticket.id}`)
            .then(response => response.json())
            .then(data => {
                ticketDetailsContent.innerHTML = `
                    <p><strong>Title:</strong> ${data.title}</p>
                    <p><strong>Employee:</strong> ${data.employee}</p>
                    <p><strong>Email:</strong> ${ticket.email}</p>
                    <p><strong>Location:</strong> ${data.location || 'N/A'}</p>
                    <p><strong>Staff Number:</strong> ${data.staff_number || 'N/A'}</p>
                    <p><strong>Phone Number:</strong> ${data.phone_number || 'N/A'}</p>
                    <p><strong>Priority:</strong> ${ticket.priority || 'N/A'}</p>
                    <p><strong>Description:</strong> ${data.description}</p>
                `;

                // Open the modal
                const modal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
                modal.show();

                // Update the button to "Restore Ticket" for archived tickets
                const archiveButton = document.getElementById('archiveTicketButton');
                archiveButton.innerText = 'Restore Ticket';
                archiveButton.onclick = function () {
                    restoreTicket(ticket);  // Restore the ticket

                    // Close the modal after restoration
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                };

                // Apply dark mode styling for the modal if dark mode is enabled
                if (document.body.classList.contains('dark-mode')) {
                    document.getElementById('ticketDetailsModalContent').classList.add('dark-mode');
                }
            })
            .catch(error => {
                console.error('Error fetching ticket details:', error);
                alert('An error occurred while fetching ticket details.');
            });
    }

    // Function to restore a ticket
    function restoreTicket(ticket) {
        fetch(`/api/tickets/${ticket.id}/archive`, {
            method: 'DELETE'  // Use DELETE to restore the ticket
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to restore ticket');
            }
            return response.json();
        })
        .then(data => {
            alert('Ticket restored successfully!');
            displayArchivedTickets(); // Refresh the archived ticket list
        })
        .catch(error => {
            console.error('Error restoring ticket:', error);
        });
    }

    // Display archived tickets when the page loads
    displayArchivedTickets();
});
