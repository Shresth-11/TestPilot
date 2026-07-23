from typing import Any
from fastapi import FastAPI, Header, HTTPException, Query, status
from pydantic import BaseModel

app = FastAPI(
    title="Sample E-Commerce & User Management API",
    version="1.0.0",
    description="Target API for testing TestPilot test generation and execution capabilities.",
)

# In-memory storage for sample data
users_db: dict[int, dict[str, Any]] = {
    1: {"id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "admin"},
    2: {"id": 2, "name": "John Smith", "email": "john@example.com", "role": "user"},
}
next_id = 3


class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "user"


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login", status_code=200)
def login(credentials: LoginRequest):
    if credentials.username == "admin@example.com" and credentials.password == "password123":
        return {
            "access_token": "sample_jwt_token_xyz_12345",
            "token_type": "bearer",
            "expires_in": 3600,
        }
    raise HTTPException(status_code=401, detail="Invalid username or password.")


@app.get("/users")
def list_users(
    limit: int = 10,
    unexpected_param: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
):
    if unexpected_param == "!@#$%^&*()":
        raise HTTPException(status_code=400, detail="Malformed parameter characters detected.")

    return list(users_db.values())[:limit]


@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    global next_id
    new_user = {
        "id": next_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }
    users_db[next_id] = new_user
    next_id += 1
    return new_user


@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")
    return users_db[user_id]


@app.put("/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")

    current = users_db[user_id]
    if user.name is not None:
        current["name"] = user.name
    if user.email is not None:
        current["email"] = user.email
    if user.role is not None:
        current["role"] = user.role

    return current


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")
    del users_db[user_id]
    return None
