document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const createTicketButton = document.getElementById('createTicketButton');
    const saveTicketButton = document.getElementById('saveTicketButton');
    const ticketList = document.getElementById('ticketList');
    const navbar = document.getElementById('navbar');
 

    let currentlyEditingTicketId = null; 

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

    // Display unassigned tickets
    function displayActiveTickets() {
        ticketList.innerHTML = ''; // Clear existing tickets
    
        fetch('/api/tickets/unassigned')  // Fetch unassigned tickets
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
        fetch(`/api/tickets/${ticket.id}/archive`, {
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

    function assignTicketPrompt(ticketId) {
        const assignedUser = prompt("Enter the username to assign this ticket to:");
    
        if (!assignedUser) {
            alert("Assignment canceled. No user was selected.");
            return;
        }
    
        assignTicket(ticketId, assignedUser); // Pass the username instead of prompting again
    }    
    
    function assignTicket(ticketId, username) { // Accept username as a parameter
        fetch(`/api/tickets/${ticketId}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) return alert("Error: " + data.error);
                alert("Ticket assigned to " + username);
                location.reload();
            })
            .catch(err => console.error("Error assigning ticket:", err));
    }

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
        
        // Reset footer before adding buttons
        modalFooter.innerHTML = '';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.textContent = 'Close';
        closeBtn.setAttribute('data-bs-dismiss', 'modal');
        modalFooter.appendChild(closeBtn);

        const archiveBtn = document.createElement('button');
        archiveBtn.className = 'btn btn-primary';
        archiveBtn.id = 'archiveTicketButton';
        archiveBtn.textContent = 'Archive Ticket';
        archiveBtn.addEventListener('click', () => {
            archiveTicket(ticket);
            bootstrap.Modal.getInstance(document.getElementById('ticketDetailsModal')).hide();
        });
        modalFooter.appendChild(archiveButton);

        // Add "Edit" button
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-warning editTicketButton';
        editButton.textContent = 'Edit';
        editButton.dataset.ticketId = ticket.id; 
        modalFooter.appendChild(editButton);

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

    if (createTicketButton) {
        createTicketButton.addEventListener('click', () => {
            currentlyEditingTicketId = null;
            document.getElementById('ticketForm').reset();
            new bootstrap.Modal(document.getElementById('createTicketModal')).show();
        });
    }

    if (saveTicketButton) {
        saveTicketButton.addEventListener('click', () => {
            const payload = {
                employee: document.getElementById('userName').value,
                staff_number: document.getElementById('staffNumber').value,
                phone_number: document.getElementById('phoneNumber').value,
                location: document.getElementById('location').value,
                title: document.getElementById('issueTitle').value,
                description: document.getElementById('issueDescription').value,
                email: document.getElementById('userEmail').value,
                priority: document.getElementById('priority').value
            };

            if (Object.values(payload).some(v => !v)) {
                alert('Please fill in all fields.');
                return;
            }

            const method = currentlyEditingTicketId ? 'PUT' : 'POST';
            const url = currentlyEditingTicketId ? `/api/tickets/${currentlyEditingTicketId}` : '/api/tickets';

            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('createTicketModal'));
                    modal.hide();
                    document.getElementById('ticketForm').reset();
                    currentlyEditingTicketId = null;
                    displayActiveTickets();
                })
                .catch(err => {
                    console.error('Error saving ticket:', err);
                    alert('Error saving ticket.');
                });
        });
    }

    document.body.addEventListener('click', function (e) {
        if (e.target.classList.contains('editTicketButton')) {
            const id = e.target.dataset.ticketId;
            fetch(`/api/tickets/${id}`)
                .then(res => res.json())
                .then(ticket => {
                    currentlyEditingTicketId = id;
                    document.getElementById('userName').value = ticket.employee;
                    document.getElementById('staffNumber').value = ticket.staff_number;
                    document.getElementById('phoneNumber').value = ticket.phone_number;
                    document.getElementById('location').value = ticket.location;
                    document.getElementById('issueTitle').value = ticket.title;
                    document.getElementById('issueDescription').value = ticket.description;
                    document.getElementById('userEmail').value = ticket.email;
                    document.getElementById('priority').value = ticket.priority;
                    bootstrap.Modal.getInstance(document.getElementById('ticketDetailsModal')).hide();
                    new bootstrap.Modal(document.getElementById('createTicketModal')).show();
                });
        }
    });

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

    if (ticketList) displayActiveTickets();
});
