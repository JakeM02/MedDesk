function searchTickets() {
  const query = document.getElementById('searchQuery').value.trim();

  let currentlyEditingTicketId = null;


  if (!query) {
      alert("Please enter a ticket ID.");
      return;
  }

  fetch(`/api/tickets/search?query=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
          if (data.message) {
              alert("No tickets found.");
              return;
          }

          // Assuming the response contains a single ticket based on the ticket ID search
          const ticket = data[0];

          // Populate the modal with ticket details
          const modalTitle = document.getElementById('ticketDetailsModalLabel');
          const modalBody = document.getElementById('ticketDetailsContent');
          const modalFooter = document.getElementById('ticketDetailsFooter');

          modalTitle.textContent = `Ticket #${ticket.id} - ${ticket.title}`;
          modalBody.innerHTML = `
              <p><strong>Staff Number:</strong> ${ticket.staff_number}</p>
              <p><strong>User Name:</strong> ${ticket.employee}</p>
              <p><strong>User Email:</strong> ${ticket.email}</p>
              <p><strong>Phone Number:</strong> ${ticket.phone_number}</p>
              <p><strong>Location:</strong> ${ticket.location}</p>
              <p><strong>Description:</strong> ${ticket.description}</p>  
              <p><strong>Priority:</strong> ${ticket.priority || 'N/A'}</p>
              <p><strong>Assigned to:</strong> ${ticket.assigned_username || 'Unassigned'}</p>                   
          `;

          modalFooter.innerHTML = '';

          // Close Button
          const closeButton = document.createElement('button');
          closeButton.className = 'btn btn-secondary';
          closeButton.setAttribute('data-bs-dismiss', 'modal');
          closeButton.textContent = 'Close';
          modalFooter.appendChild(closeButton);

          // Edit Button
          const editButton = document.createElement('button');
          editButton.className = 'btn btn-warning';
          editButton.textContent = 'Edit';
          editButton.addEventListener('click', function () {
              currentlyEditingTicketId = ticket.id;

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
          modalFooter.appendChild(editButton);

          const ticketDetailsModal = new bootstrap.Modal(document.getElementById('ticketDetailsModal'));
          ticketDetailsModal.show();
      })
      .catch(error => {
          console.error('Error searching tickets:', error);
          alert('An error occurred while searching for the ticket.');
      });
}

// Add event listener for the search button
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('searchButton').addEventListener('click', searchTickets);
});