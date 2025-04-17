document.addEventListener('DOMContentLoaded', function () {
  const saveBtn = document.getElementById('saveTicketButton');

  // Handle Edit button click
  document.body.addEventListener('click', function (event) {
    if (event.target && event.target.classList.contains('editTicketButton')) {
        const ticketId = event.target.dataset.ticketId;

        if (!ticketId) {
            alert("No ticket ID found for editing.");
            return;
        }

        // Close the ticket details modal first
        const ticketDetailsModal = document.getElementById('ticketDetailsModal');
        const modalInstance = bootstrap.Modal.getInstance(ticketDetailsModal);
        if (modalInstance) modalInstance.hide();

        // Fetch ticket data to prefill the form
          fetch(`/api/tickets/${ticketId}`)
              .then(res => res.json())
              .then(ticket => {
                  // Fill the form with current ticket data
                  document.getElementById('staffNumber').value = ticket.staff_number || '';
                  document.getElementById('userName').value = ticket.employee || '';
                  document.getElementById('userEmail').value = ticket.email || '';
                  document.getElementById('phoneNumber').value = ticket.phone_number || '';
                  document.getElementById('location').value = ticket.location || '';
                  document.getElementById('issueTitle').value = ticket.title || '';
                  document.getElementById('issueDescription').value = ticket.description || '';
                  document.getElementById('priority').value = ticket.priority || 'Medium';

                  // Set editing state
                  saveBtn.dataset.editing = ticket.id;

                  // Show the create/edit modal
                  const editModal = new bootstrap.Modal(document.getElementById('createTicketModal'));
                  editModal.show();
              })
              .catch(err => {
                  console.error("Failed to load ticket data:", err);
                  alert("Could not load ticket for editing.");
              });
      }
  });

  // Save or Update ticket
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
                  if (modal) modal.hide();
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
