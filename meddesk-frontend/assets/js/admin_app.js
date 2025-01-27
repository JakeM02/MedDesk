document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const createTicketButton = document.getElementById('createTicketButton');
    const saveTicketButton = document.getElementById('saveTicketButton');
    const ticketList = document.getElementById('ticketList');
    const navbar = document.getElementById('navbar');

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


    // Display unassigned tickets
    function displayActiveTickets() {
        ticketList.innerHTML = ''; // Clear existing tickets
    
        fetch('http://127.0.0.1:5000/api/tickets/unassigned')  // Fetch unassigned tickets
            .then(response => response.json())
            .then(tickets => {
                if (tickets.length === 0) {
                    ticketList.innerHTML = '<p>No unassigned tickets available.</p>';
                    return;
                }
    
                tickets.forEach(ticket => {
                    const ticketDiv = document.createElement('div');
                    ticketDiv.className = 'ticket-box col-md-4';
                    ticketDiv.innerHTML = `
                        <h5>Ticket #${ticket.id}: ${ticket.title}</h5>
                        <p>Employee: ${ticket.employee}</p>
                        <p><strong>Priority:</strong> <span class="priority-badge">${ticket.priority}</span></p>
                    `;
                    // Click event to open ticket modal
                    ticketDiv.addEventListener('click', () => openTicketFromActive(ticket));
                    ticketList.appendChild(ticketDiv);

                    // Apply dark mode styling if it's enabled
                    if (document.body.classList.contains('dark-mode')) {
                        ticketDiv.classList.add('dark-mode');
                    }
                });
            })
            .catch(error => console.error('Error fetching unassigned tickets:', error));
    }

    // Function to archive a ticket
    function archiveTicket(ticket) {
        fetch(`http://127.0.0.1:5000/api/tickets/${ticket.id}/archive`, {
            method: 'POST', // Use POST to archive the ticket
            headers: {
                "Content-Type": "application/json"
            }  
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

    function assignTicketPrompt(ticketId) {
        const assignedUser = prompt("Enter the username to assign this ticket to:");
    
        if (!assignedUser) {
            alert("Assignment canceled. No user was selected.");
            return;
        }
    
        assignTicket(ticketId, assignedUser); // Pass the username instead of prompting again
    }    
    
    function assignTicket(ticketId, username) { // Accept username as a parameter
        fetch(`http://127.0.0.1:5000/api/tickets/${ticketId}/assign`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: username }) // Use the provided username
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
            } else {
                alert("Ticket assigned successfully to " + username);
                location.reload(); // Refresh to reflect changes
            }
        })
        .catch(error => console.error("Error assigning ticket:", error));
    }


    // Open ticket details in a modal
    function openTicketFromActive(ticket) {
        const ticketDetailsContent = document.getElementById('ticketDetailsContent');
        const ticketDetailsModalLabel = document.getElementById('ticketDetailsModalLabel');
        const modalFooter = document.getElementById('ticketDetailsFooter');

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

        // Reset footer before adding buttons
        modalFooter.innerHTML = '';

        // Add "Close" button
        const closeButton = document.createElement('button');
        closeButton.className = 'btn btn-secondary';
        closeButton.setAttribute('data-bs-dismiss', 'modal');
        closeButton.textContent = 'Close';
        modalFooter.appendChild(closeButton);

        // Add "Archive Ticket" button
        const archiveButton = document.createElement('button');
        archiveButton.className = 'btn btn-primary';
        archiveButton.id = 'archiveTicketButton';
        archiveButton.textContent = 'Archive Ticket';
        archiveButton.addEventListener('click', function () {
            archiveTicket(ticket);
            bootstrap.Modal.getInstance(document.getElementById('ticketDetailsModal')).hide();
        });
        modalFooter.appendChild(archiveButton);

        // Add "Assign Ticket" button
        const assignButton = document.createElement('button');
        assignButton.className = 'btn btn-success';
        assignButton.id = 'assignTicketButton';
        assignButton.textContent = 'Assign Ticket';
        assignButton.addEventListener('click', function () {
            assignTicketPrompt(ticket.id);
        });
        modalFooter.appendChild(assignButton);

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

    document.addEventListener('DOMContentLoaded', function () {
        const unassignedTicketsBtn = document.getElementById('unassignedTicketsBtn');
        const myTicketsBtn = document.getElementById('myTicketsBtn');
    
        if (unassignedTicketsBtn) {
            unassignedTicketsBtn.addEventListener('click', function () {
                displayActiveTickets();  // Show unassigned tickets
            });
        }
    
        if (myTicketsBtn) {
            myTicketsBtn.addEventListener('click', function () {
                displayMyTickets();  // Show tickets assigned to the logged-in user
            });
        }
    
    });
    


    // Initial display of active tickets (on page load)
    if (ticketList) {
        displayActiveTickets();
    }
});
