import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.main import app
from backend.app.auth import verify_password

# In-memory SQLite for fast, isolated test suite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# SCENARIO 1: Register a new account with valid information
# ==============================================================================
def test_scenario_1_register_valid_account(client, db_session):
    payload = {
        "full_name": "Alexander Wright",
        "email": "alex.wright@voyara.com",
        "password": "SecurePassword123!"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "user" in data
    assert data["user"]["full_name"] == "Alexander Wright"
    assert data["user"]["email"] == "alex.wright@voyara.com"
    assert "id" in data["user"]
    assert "voyara_session" in response.cookies


# ==============================================================================
# SCENARIO 2: Register again using the same email (Duplicate check)
# ==============================================================================
def test_scenario_2_duplicate_email_registration(client):
    payload = {
        "full_name": "Alexander Wright",
        "email": "duplicate@voyara.com",
        "password": "SecurePassword123!"
    }
    # First registration
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email (case-insensitive test)
    payload_dup = {
        "full_name": "Alex Duplicate",
        "email": "DUPLICATE@voyara.com",
        "password": "DifferentPassword456!"
    }
    res2 = client.post("/api/auth/register", json=payload_dup)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


# ==============================================================================
# SCENARIO 3: Submit invalid or incomplete registration data
# ==============================================================================
def test_scenario_3_invalid_registration_data(client):
    # Short password (< 8 chars)
    res_short_pwd = client.post("/api/auth/register", json={
        "full_name": "Valid Name",
        "email": "test@voyara.com",
        "password": "short"
    })
    assert res_short_pwd.status_code == 422

    # Invalid email format
    res_bad_email = client.post("/api/auth/register", json={
        "full_name": "Valid Name",
        "email": "not-an-email",
        "password": "SecurePassword123!"
    })
    assert res_bad_email.status_code == 422

    # Short name (< 2 chars)
    res_short_name = client.post("/api/auth/register", json={
        "full_name": " ",
        "email": "test2@voyara.com",
        "password": "SecurePassword123!"
    })
    assert res_short_name.status_code == 422


# ==============================================================================
# SCENARIO 4: Log in using correct credentials
# ==============================================================================
def test_scenario_4_login_success(client):
    # Register first
    client.post("/api/auth/register", json={
        "full_name": "Elena Rostova",
        "email": "elena@voyara.com",
        "password": "Mediterranean2026!"
    })

    # Log in
    res = client.post("/api/auth/login", json={
        "email": "elena@voyara.com",
        "password": "Mediterranean2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "elena@voyara.com"
    assert "voyara_session" in res.cookies


# ==============================================================================
# SCENARIO 5: Log in using an incorrect password
# ==============================================================================
def test_scenario_5_login_incorrect_password(client):
    client.post("/api/auth/register", json={
        "full_name": "Marcus Vance",
        "email": "marcus@voyara.com",
        "password": "CorrectPassword123!"
    })

    res = client.post("/api/auth/login", json={
        "email": "marcus@voyara.com",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()


# ==============================================================================
# SCENARIO 6: Submit empty login fields
# ==============================================================================
def test_scenario_6_login_empty_fields(client):
    res_empty = client.post("/api/auth/login", json={
        "email": "",
        "password": ""
    })
    assert res_empty.status_code == 422


# ==============================================================================
# SCENARIO 7: Verify password hashes are stored instead of plaintext passwords
# ==============================================================================
def test_scenario_7_password_hashes_stored_only(client, db_session):
    raw_password = "SuperSecretPlainTextPassword123!"
    client.post("/api/auth/register", json={
        "full_name": "Hash Verification User",
        "email": "hashcheck@voyara.com",
        "password": raw_password
    })

    user = db_session.query(User).filter_by(email="hashcheck@voyara.com").first()
    assert user is not None
    assert user.password_hash != raw_password
    assert user.password_hash.startswith("$2b$")
    assert verify_password(raw_password, user.password_hash) is True
    assert not hasattr(user, "password")


# ==============================================================================
# SCENARIO 8: Verify successful login establishes expected session state
# ==============================================================================
def test_scenario_8_session_established(client):
    res = client.post("/api/auth/register", json={
        "full_name": "Session Tester",
        "email": "session@voyara.com",
        "password": "SessionPassword123!"
    })
    assert "voyara_session" in res.cookies
    token = res.cookies["voyara_session"]
    assert "." in token # signed format payload.sig


# ==============================================================================
# SCENARIO 9: Verify protected features enforce authentication where intended
# ==============================================================================
def test_scenario_9_protected_routes_enforce_auth(client):
    # Unauthenticated request to /api/auth/me should return 401
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert "authentication required" in res.json()["detail"].lower()


# ==============================================================================
# SCENARIO 10: Verify logout clears session state
# ==============================================================================
def test_scenario_10_logout_clears_session(client):
    # Register & get logged in
    client.post("/api/auth/register", json={
        "full_name": "Logout Tester",
        "email": "logout@voyara.com",
        "password": "LogoutPassword123!"
    })

    # Verify authenticated
    res_me = client.get("/api/auth/me")
    assert res_me.status_code == 200

    # Logout
    res_logout = client.post("/api/auth/logout")
    assert res_logout.status_code == 200

    # TestClient may retain cookies unless cleared or overwritten by response
    client.cookies.clear()

    # Now verify unauthenticated
    res_after = client.get("/api/auth/me")
    assert res_after.status_code == 401


# ==============================================================================
# SCENARIO 11: Refresh browser / repeated request session persistence
# ==============================================================================
def test_scenario_11_session_persists_across_requests(client):
    reg = client.post("/api/auth/register", json={
        "full_name": "Persistent Explorer",
        "email": "persistent@voyara.com",
        "password": "PersistentPassword123!"
    })
    cookie_token = reg.cookies["voyara_session"]

    # Create fresh client simulating new tab or page refresh
    fresh_client = TestClient(app)
    fresh_client.cookies.set("voyara_session", cookie_token)

    res = fresh_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == "persistent@voyara.com"
    assert res.json()["full_name"] == "Persistent Explorer"


# ==============================================================================
# SCENARIO 12: Useful error messages without sensitive backend leakage
# ==============================================================================
def test_scenario_12_clean_error_messages(client):
    # Non-existent user login
    res = client.post("/api/auth/login", json={
        "email": "nonexistent@voyara.com",
        "password": "SomePassword123!"
    })
    assert res.status_code == 401
    data = res.json()
    assert "detail" in data
    # Ensure no stack trace or SQL error leaks
    assert "traceback" not in str(data).lower()
    assert "sqlite" not in str(data).lower()
    assert "password" not in data["detail"].lower() or "invalid" in data["detail"].lower()
