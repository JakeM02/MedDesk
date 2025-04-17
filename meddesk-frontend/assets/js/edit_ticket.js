document.addEventListener('DOMContentLoaded', function () {
  document.body.addEventListener('click', function (event) {
      if (event.target && event.target.id === 'editTicketButton') {
          // Collect ticket ID from modal title or data attribute
          const modalTitle = document.getElementById('ticketDetailsModalLabel').textContent;
          const match = modalTitle.match(/Ticket #(\d+)/);
          const ticketId = match ? match[1] : null;

          if (!ticketId) {
              alert("Ticket ID not found.");
              return;
          }

          fetch(`/api/tickets/${ticketId}`)
              .then(res => res.json())
              .then(ticket => {
                  // Pre-fill the create form with existing ticket data
                  document.getElementById('staffNumber').value = ticket.staff_number || '';
                  document.getElementById('userName').value = ticket.employee || '';
                  document.getElementById('userEmail').value = ticket.email || '';
                  document.getElementById('phoneNumber').value = ticket.phone_number || '';
                  document.getElementById('location').value = ticket.location || '';
                  document.getElementById('issueTitle').value = ticket.title || '';
                  document.getElementById('issueDescription').value = ticket.description || '';
                  document.getElementById('priority').value = ticket.priority || 'Medium';

                  // Add a flag so the "save" button knows we're editing
                  document.getElementById('saveTicketButton').dataset.editing = ticketId;

                  // Show the create modal (used as an edit form now)
                  const editModal = new bootstrap.Modal(document.getElementById('createTicketModal'));
                  editModal.show();
              })
              .catch(err => {
                  console.error("Failed to load ticket data for editing:", err);
                  alert("Failed to load ticket for editing.");
              });
      }
  });

  // Override save behavior if editing
  const saveBtn = document.getElementById('saveTicketButton');
  if (saveBtn) {
      saveBtn.addEventListener('click', function () {
          const editingId = this.dataset.editing;

          const updatedTicket = {
              employee: document.getElementById('userName').value,
              staff_number: document.getElementById('staffNumber').value,
              phone_number: document.getElementById('phoneNumber').value,
              location: document.getElementById('location').value,
              title: document.getElementById('issueTitle').value,
              description: document.getElementById('issueDescription').value,
              email: document.getElementById('userEmail').value,
              priority: document.getElementById('priority').value
          };

          const method = editingId ? 'PUT' : 'POST';
          const url = editingId ? `/api/tickets/${editingId}` : '/api/tickets';

          fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedTicket)
          })
              .then(res => res.json())
              .then(() => {
                  const modal = bootstrap.Modal.getInstance(document.getElementById('createTicketModal'));
                  modal.hide();
                  document.getElementById('ticketForm').reset();
                  delete saveBtn.dataset.editing;
                  location.reload(); // refresh ticket list
              })
              .catch(err => {
                  console.error("Save failed:", err);
                  alert("Error saving ticket.");
              });
      });
  }
});
