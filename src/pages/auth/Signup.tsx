import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../utils/api';
import { setAccessToken, setUser, type AuthResponse } from '../../utils/auth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import './Auth.css';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 8 || password.length > 20) {
      setError('비밀번호는 8-20자여야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', {
        email,
        password,
      });

      setAccessToken(response.access_token);
      setUser(response.user);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">회원가입</h1>
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
            minLength={8}
            maxLength={20}
          />
          <Input
            type="password"
            label="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          {error && <div className="auth-error">{error}</div>}
          <Button type="submit" disabled={loading} className="auth-submit">
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
        <div className="auth-links">
          <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
