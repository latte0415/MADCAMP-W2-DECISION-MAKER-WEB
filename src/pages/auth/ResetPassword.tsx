import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../utils/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import './Auth.css';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/password-reset/request', { email });
      setMessage('비밀번호 재설정 링크를 이메일로 전송했습니다.');
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8 || newPassword.length > 20) {
      setError('비밀번호는 8-20자여야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/password-reset/confirm', {
        token,
        new_password: newPassword,
      });
      setMessage('비밀번호가 성공적으로 재설정되었습니다.');
    } catch (err: any) {
      setError(err.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">비밀번호 재설정</h1>
        {step === 'request' ? (
          <form onSubmit={handleRequest} className="auth-form">
            <Input
              type="email"
              label="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}
            <Button type="submit" disabled={loading} className="auth-submit">
              {loading ? '전송 중...' : '재설정 링크 전송'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="auth-form">
            <Input
              type="text"
              label="재설정 토큰"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              type="password"
              label="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
              maxLength={20}
            />
            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}
            <Button type="submit" disabled={loading} className="auth-submit">
              {loading ? '재설정 중...' : '비밀번호 재설정'}
            </Button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
