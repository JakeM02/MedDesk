import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'meddesk-backend')))
from server import create_app


@pytest.fixture
def client():
    app = create_app()
    app.testing = True
    with app.test_client() as client:
        yield client

# Login tests
def test_login_valid(client):
    response = client.post('/api/login', json={"username": "test", "password": "test"})
    assert response.status_code == 200
    assert "message" in response.json

def test_login_invalid(client):
    response = client.post('/api/login', json={"username": "test", "password": "invalid"})
    assert response.status_code == 401

# Ticket Tests 
def test_create_ticket(client):
    ticket_data = {
        "title": "Test Ticket",
        "employee": "Test",
        "email": "test@test.com",
        "description": "Test ",
        "staff_number": "123",
        "phone_number": "1234567890",
        "location": "test",
        "priority": "High"
    }
    response = client.post('/api/tickets', json=ticket_data)
    assert response.status_code == 201
    assert response.json["title"] == "Test Ticket"

def test_get_all_tickets(client):
    response = client.get('/api/tickets')
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_assign_ticket(client):
    assign_data = {"username": "admin"}
    response = client.post('/api/tickets/1/assign', json=assign_data)
    assert response.status_code == 200
    assert response.json["ticket"]["assigned_username"] == "admin"

def test_archive_ticket(client):
    response = client.post('/api/tickets/1/archive')
    assert response.status_code == 200
    assert response.json["archived"] is True

def test_recover_ticket(client):
    response = client.delete('/api/tickets/1/archive')
    assert response.status_code == 200
    assert response.json["archived"] is False

def test_search_ticket_by_id(client):
    response = client.get('/api/tickets/search?query=1')
    assert response.status_code == 200
    data = response.json[0]
    assert data["id"] == 1
    assert "assigned_username" in data  
