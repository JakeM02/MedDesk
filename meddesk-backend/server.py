from flask import Flask, jsonify, render_template, request, g ,session #flask framework
from flask_cors import CORS # Cross origin for APIs
from flask_sqlalchemy import SQLAlchemy # ORM allows code to convert to database data
from functools import wraps #for enforcing admin permissions
import hashlib #password hashing
import os # OS functions (generating random key)

# Initialize SQLAlchemy
db = SQLAlchemy()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def create_app():
    """Create and configure the Flask app."""
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, '../meddesk-frontend/assets/templates'),
        static_folder=os.path.join(BASE_DIR, '../meddesk-frontend/assets'))

    CORS(app)  # Enable CORS for all routes

    # Database configuration using pg8000 driver
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL env‑var not set – check CI or local .env")

    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1) # avoids issues with heroku and SQLAlchemy

    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False #disabled tracking changes to avoid warnings and performance

    app.config['SESSION_COOKIE_SECURE'] = True  # Ensures cookie only sent over HTTPS
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Allows navigation from login POST
    app.config['SESSION_COOKIE_HTTPONLY'] = True


    # generates secret key for sessions
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')

    # Initialize the SQLAlchemy object
    db.init_app(app)

    #Define User model
    class User(db.Model):
        __tablename__ = 'users'
        __table_args__ = {'extend_existing': True}
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(150), unique=True, nullable=False)
        password_hash = db.Column(db.String(200), nullable=False)
        is_admin = db.Column(db.Boolean, default=False)
        created_at = db.Column(db.DateTime, default=db.func.now())
    
    # Define Ticket model
    class Ticket(db.Model):
        __tablename__ = 'ticket'
        __table_args__ = {'extend_existing': True}
        id = db.Column(db.Integer, primary_key=True)
        title = db.Column(db.String(32), nullable=False)
        employee = db.Column(db.String(200), nullable=False)
        email = db.Column(db.String(200), nullable=False)
        location = db.Column(db.String(200), nullable=True)
        staff_number = db.Column(db.String(50), nullable=True)
        phone_number = db.Column(db.String(50), nullable=True)
        description = db.Column(db.Text, nullable=False)
        archived = db.Column(db.Boolean, default=False)
        priority = db.Column(db.String(20), nullable=False, default="Medium")
        assigned_username = db.Column(db.String(50),db.ForeignKey('users.username'), nullable=True)

        #compatible with jsonify to structure data
        def to_dict(self):
            """Convert the Ticket object into a dictionary."""
            return {
                "id": self.id,
                "title": self.title,
                "employee": self.employee,
                "email": self.email,
                "location": self.location,
                "staff_number": self.staff_number,
                "phone_number": self.phone_number,
                "description": self.description,
                "archived": self.archived,
                "priority": self.priority,
                "assigned_username": self.assigned_username
            }

    # define employee model
    class Employee(db.Model):
        __tablename__ = 'employees'
        __table_args__ = {'extend_existing': True}
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(100), nullable=False)
        email = db.Column(db.String(100), unique=True, nullable=False)
        staff_number = db.Column(db.String(50), unique=True, nullable=False)
        phone_number = db.Column(db.String(15), nullable=True)
        location = db.Column(db.String(100), nullable=True)     
            
    # Function to hash a password with a salt
    def hash_password(password: str) -> str:
        """Hash a password using SHA256 with a salt."""
        salt = os.urandom(16)  # Generate a 16-byte random salt
        hashed_password = hashlib.sha256(salt + password.encode()).hexdigest()
        return f"{salt.hex()}:{hashed_password}"

    # Function to verify a password against a stored hash
    def verify_password(stored_password: str, provided_password: str) -> bool:
        """Verify a provided password against the stored hash."""
        try:
            salt, hashed_password = stored_password.split(':')
            rehashed_password = hashlib.sha256(bytes.fromhex(salt) + provided_password.encode()).hexdigest()
            return rehashed_password == hashed_password
        except ValueError:
            return False  # Handle incorrect format
        
    def admin_required(f): # enforces admin-only    
        @wraps(f) # wraps function so arguments are passed through
        def decorated_function(*args, **kwargs):
            # Fetch user_id from session set at login
            user_id = session.get('user_id')
            if not user_id:
                return jsonify({"error": "User ID is missing in session"}), 400

            # Check if the user is admin by their user_id
            user = User.query.get(user_id)
            if not user or not user.is_admin:  # Ensure user is admin
                return jsonify({"error": "Admin access required"}), 403

            g.user = user  # Store the user in the Flask global object for later use
            return f(*args, **kwargs)
        return decorated_function

# API routes
    #root url
    @app.route('/')
    def home():
        return render_template("login.html") #login page
    
    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html')

    @app.route('/archive')
    def archive():
        return render_template('archive.html')
    
    @app.route('/my_tickets')
    def my_tickets():
        return render_template('my_tickets.html')

    
    @app.route('/admin/dashboard')
    @admin_required  # Only allow access if the user is an admin
    def admin_dashboard():
        """Render the admin dashboard."""
        return render_template("admin_dashboard.html")  # admin dashboard HTML page
    
    @app.route('/admin/archive', methods=['GET'])
    @admin_required  # Ensure only admin can access
    def admin_archive():
        return render_template('admin_archive.html')
    
    @app.route('/admin/admin_tickets', methods=['GET'])
    @admin_required  # Ensure only admin can access
    def admin_tickets():
        return render_template('admin_tickets.html')
    

    #Users
    @app.route('/api/login', methods=['POST'])
    def login():
        """Admin login"""
        data = request.json
        user = User.query.filter_by(username=data['username']).first()

        # If the user is not found or the password doesn't match, return error
        if user and verify_password(user.password_hash, data['password']):
            session['user_id'] = user.id  # Store user ID in the session

            if user.is_admin:
                return jsonify({
                    "message": "Login successful",
                    "user_id": user.id,
                    "is_admin": user.is_admin,
                    "redirect_url": "/admin/dashboard"
                }), 200
            else:
                return jsonify({
                    "message": "Login successful",
                    "user_id": user.id,
                    "is_admin": user.is_admin,
                    "redirect_url": "/dashboard"
                }), 200
        return jsonify({"error": "Invalid credentials"}), 401

    @app.route('/api/admin/users', methods=['POST'])
    @admin_required  # Only allow access if the user is an admin
    def create_normal_user():
        """Create a normal user."""
        data = request.json
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Username and password are required"}), 400

        # Make sure that the user does not already exist
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Username already exists"}), 400

        try:
            # Create the normal user (admin=False)
            hashed_password = hash_password(data['password'])
            new_user = User(username=data['username'], password_hash=hashed_password, is_admin=False)
            db.session.add(new_user)
            db.session.commit()
            return jsonify({"message": "User created successfully", "user_id": new_user.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route('/api/logout', methods=['POST'])
    def logout():
        """Handle user logout."""
        # Clear session or token here if necessary
        return jsonify({"message": "Logged out successfully"}), 200



    #Tickets/Archiving
    @app.route('/api/tickets', methods=['GET'])
    def get_tickets():
        """Fetch all tickets and sort by priority."""

        PRIORITY_ORDER = {
        "Critical": 1,
        "High": 2,
        "Medium": 3,
        "Low": 4
    }
        tickets = Ticket.query.all()
        sorted_tickets = sorted(tickets, key=lambda ticket: PRIORITY_ORDER.get(ticket.priority, 5))
        return jsonify([ticket.to_dict() for ticket in sorted_tickets])

    @app.route('/api/tickets', methods=['POST'])
    def create_ticket():
        """Create a new ticket."""
        data = request.json
        if not data:
            return jsonify({"error": "Invalid input, JSON data is required"}), 400

        if len(data['title']) > 32:
            return jsonify({"error": "Title must be 32 characters or less"}), 400
        
        try:
            # Check what data is received
            print("Received data:", data)

            new_ticket = Ticket(
                title=data['title'],
                employee=data['employee'],
                email=data['email'],
                description=data['description'],
                staff_number=data.get('staff_number'),
                phone_number=data.get('phone_number'),
                location=data.get('location'),
                priority=data.get('priority', 'Medium')
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
    
    @app.route('/api/tickets/unassigned', methods=['GET'])
    def get_unassigned_tickets():
        """Fetch all unassigned tickets."""
        tickets = Ticket.query.filter_by(assigned_username=None, archived=False).order_by(Ticket.id).all()
        return jsonify([ticket.to_dict() for ticket in tickets])
    
    @app.route('/api/tickets/my', methods=['GET'])
    def get_my_tickets():
        """Fetch tickets assigned to the logged-in user (Session-Based)"""
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 403  # Return 403 if session is missing

        user_id = session['user_id']  # Extract user ID from session

        # Fetch user data 
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # compare  assigned_username with user.username
        tickets = Ticket.query.filter_by(assigned_username=user.username).all()

        return jsonify([ticket.to_dict() for ticket in tickets])



    @app.route('/api/tickets/<int:id>/archive', methods=['POST', 'DELETE'])
    def toggle_ticket_archive(id):
        ticket = Ticket.query.get_or_404(id)
        
        if request.method == 'POST':
            # Archive the ticket
            ticket.archived = True
            ticket.assigned_username = None  # Unassign the user
        elif request.method == 'DELETE':
            # Restore the ticket
            ticket.archived = False

        try:
            db.session.commit()
            return jsonify({'message': 'Ticket archive status updated', 'archived': ticket.archived, 'ticket': ticket.to_dict()})
        except Exception as e:
            db.session.rollback()  # Rollback in case of error
            return jsonify({"error": "Failed to update ticket archive status", "details": str(e)}), 500

    @app.route('/api/tickets/<int:ticket_id>/assign', methods=['POST'])
    def assign_ticket(ticket_id):
        """Assign a ticket to a user using their username."""
        data = request.json
        print("Received data:", data)  # Debugging

        username = data.get("username")  #  Get username from request
        if not username:
            return jsonify({"error": "Username is required"}), 400

        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        print(f"Assigning ticket {ticket_id} to {username}") 

        ticket.assigned_username = username  # Assign ticket to the username
        db.session.commit()

        updated_ticket = Ticket.query.get(ticket_id)
        print(f"Updated ticket data: {updated_ticket.assigned_username}")

        return jsonify({"message": "Ticket assigned successfully", "ticket": ticket.to_dict()}), 200


    #search employee by staff number
    @app.route('/api/employees/<string:staff_number>', methods=['GET'])
    def get_employee_info(staff_number):
        employee = Employee.query.filter_by(staff_number=staff_number).first()
        if employee:
            return jsonify({
                "name": employee.name,
                "email": employee.email,
                "phone_number": employee.phone_number,
                "location": employee.location
            })
        return jsonify({"error": "Employee not found"}), 404
    
    #search tickets by id 
    @app.route('/api/tickets/search', methods=['GET'])
    def search_tickets():
        query = request.args.get('query', '').strip()

        if not query:
            return jsonify({"error": "Search query is required"}), 400

        # Perform the search by ticket ID
        try:
            ticket_id = int(query)  # Try to convert the query into an integer for ticket id
        except ValueError:
            return jsonify({"error": "Invalid ticket ID format"}), 400

        search_results = Ticket.query.filter_by(id=ticket_id).all()

        if not search_results:
            return jsonify({"message": "No tickets found"}), 404

        return jsonify([
            {
                "id": ticket.id,
                "title": ticket.title,
                "employee": ticket.employee,
                "email": ticket.email,
                "location": ticket.location,
                "staff_number": ticket.staff_number,
                "phone_number": ticket.phone_number,
                "description": ticket.description,
                "archived": ticket.archived,
                "assigned_username": ticket.assigned_username
            }
            for ticket in search_results
        ])

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
