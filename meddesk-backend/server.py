from flask import Flask, jsonify
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Example ticket data
tickets = [
    {"id": 1, "title": "Computer Issue", "employee": "John Doe", "description": "PC not turning on"},
    {"id": 2, "title": "Printer Malfunction", "employee": "Mary Smith", "description": "Printer jammed"},
    {"id": 3, "title": "Network Issue", "employee": "Jake Brown", "description": "WiFi connectivity problems"},
]

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    return jsonify(tickets)

if __name__ == '__main__':
    app.run(debug=True)
