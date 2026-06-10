import pytest
from app.services.auth.service import AuthService
from app.infra.exceptions import AppException, ConflictException
from app.models.auth.user import User


class TestRegister:
    def test_register_success(self, db):
        svc = AuthService(db)
        tokens = svc.register(name="新用户", email="new@test.com", password="123456", role="labeler")
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"

        user = db.query(User).filter(User.email == "new@test.com").first()
        assert user is not None
        assert user.name == "新用户"
        assert user.role == "labeler"

    def test_register_duplicate(self, db):
        svc = AuthService(db)
        svc.register(name="A", email="dup@test.com", password="123456")
        with pytest.raises(ConflictException) as exc:
            svc.register(name="B", email="dup@test.com", password="654321")
        assert "已被注册" in exc.value.message

    def test_default_role_is_labeler(self, db):
        svc = AuthService(db)
        svc.register(name="默认", email="default@test.com", password="123456")
        user = db.query(User).filter(User.email == "default@test.com").first()
        assert user.role == "labeler"


class TestLogin:
    def test_login_success(self, db, seed_user):
        svc = AuthService(db)
        tokens = svc.login(email="test@test.com", password="123456")
        assert "access_token" in tokens
        assert "refresh_token" in tokens

    def test_login_wrong_password(self, db, seed_user):
        svc = AuthService(db)
        with pytest.raises(AppException) as exc:
            svc.login(email="test@test.com", password="wrong")
        assert "邮箱或密码" in exc.value.message

    def test_login_nonexistent_user(self, db):
        svc = AuthService(db)
        with pytest.raises(AppException) as exc:
            svc.login(email="no@test.com", password="123456")
        assert "邮箱或密码" in exc.value.message


class TestRefresh:
    def test_refresh_success(self, db, seed_user):
        svc = AuthService(db)
        old = svc.login(email="test@test.com", password="123456")
        new = svc.refresh(old["refresh_token"])
        assert new["access_token"] != old["access_token"]
        assert new["refresh_token"] != old["refresh_token"]

    def test_refresh_token_one_time_use(self, db, seed_user):
        svc = AuthService(db)
        old = svc.login(email="test@test.com", password="123456")
        svc.refresh(old["refresh_token"])  # 第一次用

        with pytest.raises(AppException) as exc:
            svc.refresh(old["refresh_token"])  # 第二次用同一个 token
        assert "已失效" in exc.value.message

    def test_refresh_invalid_token(self, db):
        svc = AuthService(db)
        with pytest.raises(AppException) as exc:
            svc.refresh("fake-token-never-exists")
        assert "无效" in exc.value.message
