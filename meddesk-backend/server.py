from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    """Create and configure the Flask app."""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    # Database configuration using pg8000 driver
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql+pg8000://meddeskadmin:admin@localhost/meddesk'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize the SQLAlchemy object
    db.init_app(app)

    # Create the database tables manually
    @app.before_request
    def create_tables():
        db.create_all()

    # Define Ticket model
    class Ticket(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        title = db.Column(db.String(200), nullable=False)
        employee = db.Column(db.String(200), nullable=False)
        location = db.Column(db.String(200), nullable=True)
        staff_number = db.Column(db.String(50), nullable=True)
        phone_number = db.Column(db.String(50), nullable=True)
        description = db.Column(db.Text, nullable=False)
        archived = db.Column(db.Boolean, default=False)

        def to_dict(self):
            """Convert the Ticket object into a dictionary."""
            return {
                "id": self.id,
                "title": self.title,
                "employee": self.employee,
                "location": self.location,
                "staff_number": self.staff_number,
                "phone_number": self.phone_number,
                "description": self.description,
                "archived": self.archived,
            }

    # API routes
    @app.route('/api/tickets', methods=['GET'])
    def get_tickets():
        """Fetch all tickets."""
        tickets = Ticket.query.all()
        return jsonify([ticket.to_dict() for ticket in tickets])

    @app.route('/api/tickets', methods=['POST'])
    def create_ticket():
        """Create a new ticket."""
        data = request.json
        if not data:
            return jsonify({"error": "Invalid input, JSON data is required"}), 400

        try:
            # Check what data is received
            print("Received data:", data)

            new_ticket = Ticket(
                title=data['title'],
                employee=data['employee'],
                description=data['description'],
                staff_number=data.get('staff_number'),
                phone_number=data.get('phone_number'),
                location=data.get('location'),
            )
            db.session.add(new_ticket)
            db.session.commit()
            return jsonify(new_ticket.to_dict()), 201
        except KeyError as e:
            return jsonify({"error": f"Missing field: {e.args[0]}"}), 400
        except Exception as e:
            db.session.rollback()  # Rollback the session in case of error
            return jsonify({"error": str(e)}), 500


    @app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
    def get_ticket(ticket_id):
        """Fetch a specific ticket by ID."""
        ticket = Ticket.query.get(ticket_id)
        if ticket:
            return jsonify(ticket.to_dict())
        return jsonify({"error": "Ticket not found"}), 404


    @app.route('/api/tickets/<int:ticket_id>', methods=['DELETE'])
    def delete_ticket(ticket_id):
        """Delete a specific ticket by ID."""
        ticket = Ticket.query.get(ticket_id)
        if ticket:
            db.session.delete(ticket)
            db.session.commit()
            return jsonify({"message": "Ticket deleted"}), 200
        return jsonify({"error": "Ticket not found"}), 404
    
    # Fetch active tickets (archived = False)
    @app.route('/api/tickets/active', methods=['GET'])
    def get_active_tickets():
        """Fetch active tickets (archived = False)."""
        tickets = db.session.query(Ticket).filter_by(archived=False).all()
        return jsonify([ticket.to_dict() for ticket in tickets])

    # Fetch archived tickets (archived = True)
    @app.route('/api/tickets/archived', methods=['GET'])
    def get_archived_tickets():
        """Fetch archived tickets (archived = True)."""
        tickets = db.session.query(Ticket).filter_by(archived=True).all()
        return jsonify([ticket.to_dict() for ticket in tickets])

    @app.route('/api/tickets/<int:id>/archive', methods=['POST', 'DELETE'])
    def toggle_ticket_archive(id):
        ticket = Ticket.query.get_or_404(id)
        
        if request.method == 'POST':
            # Archive the ticket
            ticket.archived = True
        elif request.method == 'DELETE':
            # Restore the ticket
            ticket.archived = False

        try:
            db.session.commit()
            return jsonify({'message': 'Ticket archive status updated', 'archived': ticket.archived, 'ticket': ticket.to_dict()})
        except Exception as e:
            db.session.rollback()  # Rollback in case of error
            return jsonify({"error": "Failed to update ticket archive status", "details": str(e)}), 500

    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
