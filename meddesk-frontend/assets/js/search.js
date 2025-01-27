function searchTickets() {
  const query = document.getElementById('searchQuery').value.trim();

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

          modalTitle.textContent = `Ticket #${ticket.id} - ${ticket.title}`;
          modalBody.innerHTML = `
              <p><strong>Staff Number:</strong> ${ticket.staff_number}</p>
              <p><strong>User Name:</strong> ${ticket.employee}</p>
              <p><strong>User Email:</strong> ${ticket.email}</p>
              <p><strong>Phone Number:</strong> ${ticket.phone_number}</p>
              <p><strong>Location:</strong> ${ticket.location}</p>
              <p><strong>Description:</strong> ${ticket.description}</p>  
              <p><strong>Assigned to:</strong> ${ticket.assigned_username || 'Unassigned'}</p>                   
          `;

          // Show the modal
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