import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../utils/api';
import { setAccessToken, setUser, type AuthResponse } from '../../utils/auth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      setAccessToken(response.access_token);
      setUser(response.user);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">로그인</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            type="email"
            label="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            label="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          {error && <div className="auth-error">{error}</div>}
          <Button type="submit" disabled={loading} className="auth-submit">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <div className="auth-links">
          <Link to="/signup">회원가입</Link>
          <Link to="/reset-password">비밀번호 재설정</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
