import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { apiClient } from '../utils/api';
import './CriterionComponent.css';

interface Proposal {
  id: string;
  proposal_status: string;
  proposal_category: string;
  proposal_content: string;
  reason: string;
  vote_count: number;
  has_voted: boolean;
}

interface ConclusionProposal {
  id: string;
  proposal_status: string;
  proposal_content: string;
  vote_count: number;
  has_voted: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface Criterion {
  id: string;
  content: string;
  conclusion: string | null;
  proposals: Proposal[];
  conclusion_proposals: ConclusionProposal[];
}

interface CriterionComponentProps {
  criterion: Criterion;
  isAdmin: boolean;
  eventId: string;
  onPropose: (action: 'modify' | 'delete' | 'comment' | 'conclusion') => void;
}

const CriterionComponent: React.FC<CriterionComponentProps> = ({
  criterion,
  isAdmin,
  eventId,
  onPropose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isFolded, setIsFolded] = useState(true);

  useEffect(() => {
    loadCommentCount();
  }, [criterion.id]);

  const loadCommentCount = async () => {
    try {
      const response = await apiClient.get<{ count: number }>(
        `/v1/events/${eventId}/criteria/${criterion.id}/comments/count`
      );
      setCommentCount(response.count);
    } catch (error) {
      console.error('코멘트 수 로드 실패:', error);
    }
  };

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const data = await apiClient.get<Comment[]>(
        `/v1/events/${eventId}/criteria/${criterion.id}/comments`
      );
      setComments(data);
      setShowComments(true);
    } catch (error) {
      console.error('코멘트 로드 실패:', error);
    }
  };

  const handleDoubleClick = () => {
    setIsFolded(false);
    onPropose('conclusion');
  };

  return (
    <Card className="criterion-card">
      <div
        className="criterion-content"
        onClick={() => onPropose('comment')}
        onDoubleClick={handleDoubleClick}
      >
        <p className="criterion-text">{criterion.content}</p>
        {isAdmin && (
          <div className="criterion-actions">
            <Button variant="ghost" onClick={() => onPropose('modify')}>
              수정
            </Button>
            <Button variant="ghost" onClick={() => onPropose('delete')}>
              삭제
            </Button>
          </div>
        )}
      </div>

      {criterion.conclusion && (
        <div className="criterion-conclusion">
          <h4 className="conclusion-label">결론</h4>
          <p>{criterion.conclusion}</p>
        </div>
      )}

      {criterion.proposals.map((proposal) => (
        <div
          key={proposal.id}
          className={`proposal-item ${
            proposal.proposal_status === 'REJECTED' ? 'rejected' : ''
          }`}
        >
          <div className="proposal-header">
            <span className="proposal-tag">
              {proposal.proposal_category === 'CREATION'
                ? '추가'
                : proposal.proposal_category === 'MODIFICATION'
                ? '수정'
                : '삭제'}
            </span>
            {proposal.proposal_content && (
              <p className="proposal-content">{proposal.proposal_content}</p>
            )}
          </div>
          {proposal.reason && <p className="proposal-reason">{proposal.reason}</p>}
          <div className="proposal-footer">
            <span className="vote-count">동의 {proposal.vote_count}명</span>
            <Button variant="ghost">동의</Button>
            {isAdmin && proposal.proposal_status === 'PENDING' && (
              <>
                <Button variant="secondary">승인</Button>
                <Button variant="secondary">기각</Button>
              </>
            )}
          </div>
        </div>
      ))}

      {criterion.conclusion_proposals.map((proposal) => (
        <div
          key={proposal.id}
          className={`proposal-item conclusion-proposal ${
            proposal.proposal_status === 'REJECTED' ? 'rejected' : ''
          }`}
        >
          <div className="proposal-header">
            <span className="proposal-tag">결론</span>
            <p className="proposal-content">{proposal.proposal_content}</p>
          </div>
          <div className="proposal-footer">
            <span className="vote-count">동의 {proposal.vote_count}명</span>
            <Button variant="ghost">동의</Button>
            {isAdmin && proposal.proposal_status === 'PENDING' && (
              <>
                <Button variant="secondary">승인</Button>
                <Button variant="secondary">기각</Button>
              </>
            )}
          </div>
        </div>
      ))}

      <div className="criterion-comments">
        <Button variant="ghost" onClick={loadComments}>
          코멘트 {commentCount}개 {showComments ? '접기' : '보기'}
        </Button>
        {showComments && (
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.creator.name || comment.creator.email}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CriterionComponent;
