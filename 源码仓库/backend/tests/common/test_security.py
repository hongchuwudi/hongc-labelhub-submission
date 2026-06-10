import pytest
import jwt as pyjwt
from app.infra.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    ALGORITHM,
)
from app.services.auth.service import hash_password, verify_password
from app.config.settings import settings
from app.infra.exceptions import AppException


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = hash_password("mypassword")
        assert hashed != "mypassword"
        assert verify_password("mypassword", hashed) is True

    def test_wrong_password(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False


class TestAccessToken:
    def test_create_and_decode(self):
        token = create_access_token(user_id=42, role="labeler")
        payload = decode_access_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "labeler"
        assert payload["type"] == "access"

    def test_decode_invalid_token(self):
        with pytest.raises(AppException) as exc:
            decode_access_token("not.a.real.token")
        assert "无效令牌" in exc.value.message

    def test_decode_wrong_type(self):
        payload = {"sub": "1", "role": "owner", "type": "refresh"}
        token = pyjwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
        with pytest.raises(AppException) as exc:
            decode_access_token(token)
        assert "类型错误" in exc.value.message

    def test_expired_token(self):
        from datetime import datetime, timedelta, timezone
        import uuid
        payload = {
            "sub": "1", "role": "owner", "type": "access",
            "iat": datetime.now(timezone.utc) - timedelta(hours=1),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            "jti": uuid.uuid4().hex,
        }
        token = pyjwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
        with pytest.raises(AppException) as exc:
            decode_access_token(token)
        assert "已过期" in exc.value.message


class TestRefreshToken:
    def test_create_is_jwt(self):
        token = create_refresh_token(user_id=1)
        payload = decode_refresh_token(token)
        assert payload["sub"] == "1"
        assert payload["type"] == "refresh"
        assert "jti" in payload
        assert "exp" in payload

    def test_unique_jti(self):
        tokens = [create_refresh_token(1) for _ in range(100)]
        jtis = {pyjwt.decode(t, settings.JWT_SECRET, algorithms=[ALGORITHM])["jti"] for t in tokens}
        assert len(jtis) == 100

    def test_decode_invalid(self):
        with pytest.raises(AppException) as exc:
            decode_refresh_token("not.a.jwt")
        assert "无效" in exc.value.message

    def test_decode_wrong_type(self):
        token = create_access_token(user_id=1, role="owner")
        with pytest.raises(AppException) as exc:
            decode_refresh_token(token)
        assert "类型错误" in exc.value.message

    def test_expired(self):
        from datetime import datetime, timedelta, timezone
        import uuid
        payload = {
            "sub": "1", "type": "refresh",
            "iat": datetime.now(timezone.utc) - timedelta(days=30),
            "exp": datetime.now(timezone.utc) - timedelta(days=1),
            "jti": uuid.uuid4().hex,
        }
        token = pyjwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
        with pytest.raises(AppException) as exc:
            decode_refresh_token(token)
        assert "已过期" in exc.value.message
