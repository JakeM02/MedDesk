document.addEventListener('DOMContentLoaded', function () {
  const ticketList = document.getElementById('ticketList');
  const navbar = document.getElementById('navbar');
  const darkModeToggle = document.getElementById('darkModeToggle');
 

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

  
  function displayMyTickets() {
    const ticketList = document.getElementById("ticketList");
    ticketList.innerHTML = "";

    fetch("/api/tickets/my", {
        method: "GET",
        credentials: "include",  // Sends session cookie with request
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(tickets => {
        if (!Array.isArray(tickets)) {
            console.error("Error: API did not return an array", tickets);
            ticketList.innerHTML = "<p>Error loading tickets.</p>";
            return;
        }

        if (tickets.length === 0) {
            ticketList.innerHTML = "<p>No tickets assigned to you.</p>";
            return;
        }

        tickets.forEach(ticket => {
            const ticketDiv = document.createElement("div");
            ticketDiv.className = "ticket-box col-md-4";
            ticketDiv.innerHTML = `
                <h5>Ticket #${ticket.id}: ${ticket.title}</h5>
                <p>Employee: ${ticket.employee}</p>
                <p><strong>Priority:</strong> <span class="priority-badge">${ticket.priority}</span></p>
            `;
            ticketDiv.addEventListener("click", () => openTicketDetails(ticket));
            ticketList.appendChild(ticketDiv);

            // Apply dark mode styling if its enabled
            if (document.body.classList.contains('dark-mode')) {
                ticketDiv.classList.add('dark-mode');
            }
        });
    })
    .catch(error => console.error("Error fetching my tickets:", error));
}

    // Function to archive a ticket and unassign it
    function archiveMyTicket(ticket) {
        fetch(`/api/tickets/${ticket.id}/archive`, {
            method: 'POST',  // Use POST to archive the ticket
            headers: {
                'Content-Type': 'application/json'
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
            displayMyTickets(); // Refresh the ticket list to remove the archived ticket
        })
        .catch(error => {
            console.error('Error archiving ticket:', error);
            alert('An error occurred while archiving the ticket. Please try again.');
        });
    }



  function openTicketDetails(ticket) {
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

      // Show the modal
      const modal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
      modal.show();

      modalFooter.innerHTML = "";  // Clears previous buttons

      // Add "Edit" button
      const editButton = document.createElement('button');
      editButton.className = 'btn btn-warning editTicketButton';
      editButton.textContent = 'Edit';
      editButton.setAttribute('data-ticket-id', ticket.id);
      editButton.addEventListener('click', function () {
          currentlyEditingTicketId = ticket.id;
      
          // Prefill the form with the existing ticket info
          document.getElementById('userName').value = ticket.employee;
          document.getElementById('staffNumber').value = ticket.staff_number;
          document.getElementById('phoneNumber').value = ticket.phone_number;
          document.getElementById('location').value = ticket.location;
          document.getElementById('issueTitle').value = ticket.title;
          document.getElementById('issueDescription').value = ticket.description;
          document.getElementById('userEmail').value = ticket.email;
          document.getElementById('priority').value = ticket.priority;
      
          // Hide ticket details modal
          bootstrap.Modal.getInstance(document.getElementById('ticketDetailsModal')).hide();
      
          // Show the edit modal
          const editModal = new bootstrap.Modal(document.getElementById('createTicketModal'));
          editModal.show();
      });

      // Add Archive Ticket button
      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn btn-primary';
      archiveButton.id = 'archiveTicketButton';
      archiveButton.textContent = 'Archive Ticket';
      archiveButton.addEventListener('click', function () {
          archiveMyTicket(ticket);
          bootstrap.Modal.getInstance(document.getElementById('ticketDetailsModal')).hide();
      });
      modalFooter.appendChild(archiveButton);
  }


    // Initial display of unassigned tickets 
    if (ticketList) {
        displayMyTickets();
    }
});
