import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import './AssumptionComponent.css';

interface Proposal {
  id: string;
  proposal_status: string;
  proposal_category: string;
  proposal_content: string;
  reason: string;
  vote_count: number;
  has_voted: boolean;
}

interface Assumption {
  id: string;
  content: string;
  proposals: Proposal[];
}

interface AssumptionComponentProps {
  assumption: Assumption;
  isAdmin: boolean;
  onPropose: (action: 'modify' | 'delete') => void;
}

const AssumptionComponent: React.FC<AssumptionComponentProps> = ({
  assumption,
  isAdmin,
  onPropose,
}) => {
  const handleVote = async (proposalId: string, hasVoted: boolean) => {
    // 투표 API 호출
    console.log('투표:', proposalId, hasVoted);
  };

  const handleStatusChange = async (proposalId: string, status: string) => {
    // 상태 변경 API 호출
    console.log('상태 변경:', proposalId, status);
  };

  return (
    <Card className="assumption-card">
      <div className="assumption-content">
        <p className="assumption-text">{assumption.content}</p>
        {isAdmin && (
          <div className="assumption-actions">
            <Button variant="ghost" onClick={() => onPropose('modify')}>
              수정
            </Button>
            <Button variant="ghost" onClick={() => onPropose('delete')}>
              삭제
            </Button>
          </div>
        )}
      </div>

      {assumption.proposals.map((proposal) => (
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
            <span className="vote-count">
              동의 {proposal.vote_count}명
            </span>
            <Button
              variant="ghost"
              onClick={() => handleVote(proposal.id, proposal.has_voted)}
            >
              {proposal.has_voted ? '동의 취소' : '동의'}
            </Button>
            {isAdmin && proposal.proposal_status === 'PENDING' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleStatusChange(proposal.id, 'ACCEPTED')}
                >
                  승인
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleStatusChange(proposal.id, 'REJECTED')}
                >
                  기각
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
};

export default AssumptionComponent;
