class TestRegisterAPI:
    def test_register(self, client, db):
        resp = client.post("/api/auth/register", json={
            "name": "API用户",
            "email": "api@test.com",
            "password": "123456",
            "role": "labeler",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["code"] == 0
        assert data["message"] == "注册成功"
        assert "access_token" in data["data"]

    def test_register_duplicate(self, client, seed_user):
        resp = client.post("/api/auth/register", json={
            "name": "重复",
            "email": "test@test.com",
            "password": "123456",
        })
        assert resp.status_code == 409
        assert "已被注册" in resp.json()["message"]


class TestLoginAPI:
    def test_login(self, client, seed_user):
        resp = client.post("/api/auth/login", json={
            "email": "test@test.com",
            "password": "123456",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["message"] == "登录成功"
        assert data["data"]["token_type"] == "bearer"

    def test_login_wrong_password(self, client, seed_user):
        resp = client.post("/api/auth/login", json={
            "email": "test@test.com",
            "password": "wrong",
        })
        assert resp.status_code == 401


class TestMeAPI:
    def test_me_with_valid_token(self, client, seed_user):
        login_resp = client.post("/api/auth/login", json={
            "email": "test@test.com", "password": "123456",
        })
        token = login_resp.json()["data"]["access_token"]

        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        me = resp.json()["data"]
        assert me["name"] == "测试员"
        assert me["email"] == "test@test.com"
        assert me["role"] == "owner"

    def test_me_without_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_with_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401


class TestRefreshAPI:
    def test_refresh(self, client, seed_user):
        login_resp = client.post("/api/auth/login", json={
            "email": "test@test.com", "password": "123456",
        })
        refresh_token = login_resp.json()["data"]["refresh_token"]

        resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert data["data"]["access_token"] != login_resp.json()["data"]["access_token"]
