import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/userguide.css";
import "../styles/global.css";

export default function UserGuidePage() {
  const navigate = useNavigate();
  const { logout, isAuthed } = useAuth();

  const sections = [
    {
      id: "getting-started",
      title: "시작하기",
      content: [
        {
          subtitle: "회원가입 및 로그인",
          description: [
            "Decision Maker를 사용하기 위해서는 먼저 계정이 필요합니다.",
            "로그인 페이지에서 Google 계정으로 간편하게 가입할 수 있습니다.",
            "가입 후에는 이름을 설정하는 단계를 거칩니다.",
            "이미 계정이 있다면 로그인 페이지에서 바로 로그인할 수 있습니다."
          ]
        },
        {
          subtitle: "홈 화면 이해하기",
          description: [
            "로그인 후 홈 화면에서는 참가 중인 모든 이벤트를 확인할 수 있습니다.",
            "각 이벤트 카드에는 주제, 진행 상태, 관리자 정보, 참가 인원이 표시됩니다.",
            "이벤트 카드를 클릭하면 상세 정보를 확인할 수 있습니다.",
            "상단의 '생성하기' 버튼으로 새 이벤트를 만들거나, '참여하기' 버튼으로 기존 이벤트에 참여할 수 있습니다."
          ]
        }
      ]
    },
    {
      id: "creating-events",
      title: "이벤트 생성하기",
      content: [
        {
          subtitle: "기본 정보 입력",
          description: [
            "홈 화면의 '생성하기' 버튼을 클릭하면 이벤트 생성 모달이 열립니다.",
            "주제: 의사결정할 주제를 명확하게 입력하세요.",
            "선택지: 최대 5개까지 선택지를 추가할 수 있습니다. 각 선택지는 비교할 대안을 나타냅니다.",
            "전제: 최대 10개까지 전제 조건을 추가할 수 있습니다. 전제는 의사결정에 영향을 미치는 가정이나 조건입니다.",
            "기준: 최대 10개까지 평가 기준을 추가할 수 있습니다. 기준은 선택지를 평가하는 데 사용되는 요소입니다.",
            "최대 인원: 이벤트에 참여할 수 있는 최대 인원 수를 설정합니다."
          ]
        },
        {
          subtitle: "투표 허용 정책 설정",
          description: [
            "투표로 전제 제안/편집 허용하기: 이 옵션을 켜면 참가자들이 전제를 제안하고 수정할 수 있습니다.",
            "전제 제안/편집 허용하는 최소 투표 수: 전제 제안이 자동으로 승인되기 위해 필요한 최소 동의 투표 수를 설정합니다.",
            "투표로 기준 제안/편집 허용하기: 이 옵션을 켜면 참가자들이 기준을 제안하고 수정할 수 있습니다.",
            "기준 제안/편집 허용하는 최소 투표 수: 기준 제안이 자동으로 승인되기 위해 필요한 최소 동의 투표 수를 설정합니다.",
            "결론이 승인되는 최소 동의 투표 퍼센티지: 각 기준에 대한 결론이 승인되기 위해 필요한 최소 동의 비율을 설정합니다 (1~100%)."
          ]
        },
        {
          subtitle: "입장 정책 설정",
          description: [
            "가입 승인 자동 여부: 이 옵션을 켜면 참가 신청이 자동으로 승인됩니다. 끄면 관리자가 수동으로 승인해야 합니다.",
            "입장 코드: 이벤트에 참여하기 위한 6자리 코드를 설정합니다. 코드는 대문자로 자동 변환됩니다.",
            "코드 랜덤 생성 버튼을 사용하면 자동으로 랜덤 코드를 생성할 수 있습니다.",
            "코드 사용 가능한지 중복 확인 버튼으로 코드가 이미 사용 중인지 확인할 수 있습니다."
          ]
        }
      ]
    },
    {
      id: "joining-events",
      title: "이벤트 참여하기",
      content: [
        {
          subtitle: "입장 코드로 참여하기",
          description: [
            "홈 화면의 '참여하기' 버튼을 클릭하면 참여 모달이 열립니다.",
            "이벤트 관리자로부터 받은 6자리 입장 코드를 입력하세요.",
            "코드는 대소문자를 구분하지 않으며, 대문자로 자동 변환됩니다.",
            "6자리 코드를 모두 입력하면 '접속' 버튼이 활성화됩니다.",
            "접속 버튼을 클릭하면 이벤트 오버뷰 화면이 표시됩니다."
          ]
        },
        {
          subtitle: "참여 승인 대기",
          description: [
            "이벤트가 자동 승인 정책을 사용하지 않는 경우, 참여 신청 후 관리자의 승인을 기다려야 합니다.",
            "이벤트 오버뷰 화면에서 현재 멤버십 상태를 확인할 수 있습니다.",
            "'승인 대기 중' 상태일 때는 이벤트에 입장할 수 없습니다.",
            "관리자가 승인하면 '가입이 승인되었습니다' 메시지와 함께 입장하기 버튼이 활성화됩니다.",
            "거절된 경우 '가입이 거절되었습니다' 메시지가 표시되며 입장할 수 없습니다."
          ]
        }
      ]
    },
    {
      id: "managing-events",
      title: "이벤트 관리하기 (관리자)",
      content: [
        {
          subtitle: "이벤트 설정 변경",
          description: [
            "이벤트 페이지에서 '설정' 버튼을 클릭하면 이벤트 설정 모달이 열립니다.",
            "기본 정보(주제, 선택지, 전제, 기준)는 이벤트가 '시작 예정' 상태일 때만 수정할 수 있습니다.",
            "최대 인원은 이벤트가 '완료' 상태가 아닐 때 수정할 수 있으며, 현재 참가 인원보다 작게 설정할 수 없습니다.",
            "투표 허용 정책과 입장 정책은 이벤트가 '완료' 상태가 아닐 때 수정할 수 있습니다.",
            "입장 코드는 생성 후 변경할 수 없습니다."
          ]
        },
        {
          subtitle: "이벤트 상태 관리",
          description: [
            "이벤트 페이지 상단의 상태 드롭다운에서 이벤트 상태를 변경할 수 있습니다.",
            "시작 예정: 이벤트가 아직 시작되지 않은 상태입니다.",
            "진행 중: 이벤트가 활발히 진행 중인 상태입니다. 이 상태에서만 투표가 가능합니다.",
            "일시정지: 일시적으로 이벤트 진행을 멈춘 상태입니다.",
            "완료: 이벤트가 종료된 상태입니다. 완료된 이벤트에서는 투표 결과를 확인할 수 있습니다."
          ]
        },
        {
          subtitle: "멤버십 관리",
          description: [
            "설정 모달에서 '멤버십 관리' 탭을 통해 참가 신청을 관리할 수 있습니다.",
            "승인 대기 중인 참가 신청 목록을 확인할 수 있습니다.",
            "개별 승인/거절: 각 참가자에 대해 개별적으로 승인 또는 거절할 수 있습니다.",
            "일괄 승인: 모든 대기 중인 신청을 한 번에 승인할 수 있습니다. 최대 인원을 초과하는 경우 일부만 승인될 수 있습니다.",
            "일괄 거절: 모든 대기 중인 신청을 한 번에 거절할 수 있습니다."
          ]
        }
      ]
    },
    {
      id: "proposing",
      title: "전제 및 기준 제안하기",
      content: [
        {
          subtitle: "전제 제안하기",
          description: [
            "이벤트 페이지의 '전제' 섹션에서 전제를 추가, 수정, 삭제할 수 있습니다.",
            "추가하기: 드롭다운에서 '전제 - 추가'를 선택하고 내용과 이유를 입력한 후 제안 버튼을 클릭합니다.",
            "수정하기: 기존 전제 옆의 '수정' 버튼을 클릭하면 드롭다운이 '전제 - 번호 - 수정'으로 변경됩니다. 수정 내용과 이유를 입력한 후 제안 버튼을 클릭합니다.",
            "삭제하기: 기존 전제 옆의 '삭제' 버튼을 클릭하면 드롭다운이 '전제 - 번호 - 삭제'로 변경됩니다. 삭제 이유를 입력한 후 제안 버튼을 클릭합니다.",
            "제안된 내용은 다른 참가자들의 동의를 받아야 승인됩니다. 동의 버튼을 클릭하여 다른 제안에 동의할 수 있습니다."
          ]
        },
        {
          subtitle: "기준 제안하기",
          description: [
            "이벤트 페이지의 '기준' 섹션에서 기준을 추가, 수정, 삭제할 수 있습니다.",
            "추가하기: 드롭다운에서 '기준 - 추가'를 선택하고 내용과 이유를 입력한 후 제안 버튼을 클릭합니다.",
            "수정하기: 기존 기준 옆의 '수정' 버튼을 클릭하면 드롭다운이 '기준 - 번호 - 수정'으로 변경됩니다. 수정 내용과 이유를 입력한 후 제안 버튼을 클릭합니다.",
            "삭제하기: 기존 기준 옆의 '삭제' 버튼을 클릭하면 드롭다운이 '기준 - 번호 - 삭제'로 변경됩니다. 삭제 이유를 입력한 후 제안 버튼을 클릭합니다.",
            "코멘트 추가: 기준을 클릭하면 드롭다운이 '기준 - 번호 - 코멘트'로 변경됩니다. 해당 기준에 대한 의견을 남길 수 있습니다.",
            "결론 제안: 기준을 더블 클릭하면 드롭다운이 '기준 - 번호 - 결론'으로 변경됩니다. 해당 기준에 대한 결론을 제안할 수 있습니다."
          ]
        },
        {
          subtitle: "제안 승인 및 동의",
          description: [
            "제안된 내용은 관리자가 직접 승인하거나, 충분한 동의 투표를 받으면 자동으로 승인됩니다.",
            "동의 버튼을 클릭하여 제안에 동의할 수 있습니다. 다시 클릭하면 동의를 취소할 수 있습니다.",
            "동의 수는 'n/m' 형식으로 표시되며, n은 동의한 인원 수, m은 전체 참가 인원 수입니다.",
            "자동 승인 정책이 활성화된 경우, 최소 투표 수에 도달하면 제안이 자동으로 승인됩니다.",
            "관리자는 제안을 직접 승인하거나 거절할 수 있습니다. 거절된 제안은 밑줄 처리되어 표시됩니다."
          ]
        }
      ]
    },
    {
      id: "voting",
      title: "투표하기",
      content: [
        {
          subtitle: "최종 투표",
          description: [
            "이벤트가 '진행 중' 상태일 때만 투표할 수 있습니다.",
            "이벤트 페이지 상단의 '투표하기' 버튼을 클릭하면 투표 모달이 열립니다.",
            "선택지 선택: 여러 선택지 중 하나를 선택합니다. 라디오 버튼 형식으로 하나만 선택할 수 있습니다.",
            "기준 우선순위 정렬: 각 기준의 중요도를 우선순위로 정렬합니다. 드래그 앤 드롭으로 순서를 변경할 수 있습니다.",
            "우선순위가 높을수록 해당 기준이 더 중요하다는 의미입니다.",
            "'투표하기' 버튼을 클릭하여 투표를 제출합니다."
          ]
        },
        {
          subtitle: "투표 수정",
          description: [
            "이미 투표한 경우, 투표 모달을 다시 열면 기존 투표 내용이 자동으로 불러와집니다.",
            "선택지나 기준 우선순위를 변경한 후 다시 제출하면 투표 내용이 업데이트됩니다.",
            "투표는 언제든지 수정할 수 있으며, 마지막 투표 내용이 반영됩니다."
          ]
        },
        {
          subtitle: "투표 결과 확인",
          description: [
            "이벤트가 '완료' 상태가 되면 투표 결과를 확인할 수 있습니다.",
            "투표 결과에는 다음 정보가 포함됩니다:",
            "- 전체 참가 인원 수 및 투표 참여 인원 수",
            "- 선택지별 투표 수 및 비율",
            "- 1순위로 가장 많이 선택된 기준",
            "- 우선순위별 가중치를 적용한 기준 점수 (1위=3점, 2위=2점, 3위=1점)",
            "투표 결과는 이벤트 페이지와 이벤트 오버뷰에서 확인할 수 있습니다."
          ]
        }
      ]
    }
  ];

  return (
    <div className="userguide-root">
      <header className="userguide-topbar">
        <div className="userguide-brand">Decision Maker</div>
        <div className="userguide-actions">
          {isAuthed ? (
            <>
              <button className="dm-btn dm-btn--outline" onClick={() => navigate("/home")}>
                홈으로
              </button>
              <button className="dm-btn dm-btn--outline" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <button className="dm-btn dm-btn--outline" onClick={() => navigate("/login")}>
              로그인
            </button>
          )}
        </div>
      </header>

      <main className="userguide-main">
        <div className="userguide-header-section">
          <h1 className="userguide-header-title">사용자 가이드</h1>
          <p className="userguide-header-subtitle">
            Decision Maker를 효과적으로 사용하는 방법을 단계별로 알아보세요
          </p>
        </div>

        <div className="userguide-content">
          {sections.map((section, sectionIndex) => (
            <section key={section.id} className="userguide-section" id={section.id}>
              <div className="userguide-section-header">
                <span className="userguide-section-number">{sectionIndex + 1}</span>
                <h2 className="userguide-section-title">{section.title}</h2>
              </div>

              <div className="userguide-section-content">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex} className="userguide-subsection">
                    <h3 className="userguide-subsection-title">{item.subtitle}</h3>
                    <ul className="userguide-description-list">
                      {item.description.map((desc, descIndex) => (
                        <li key={descIndex} className="userguide-description-item">
                          {desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="userguide-footer">
          <p className="userguide-footer-text">
            추가 도움이 필요하신가요? 이벤트 관리자에게 문의하세요.
          </p>
          {isAuthed ? (
            <button className="dm-btn" onClick={() => navigate("/home")}>
              홈으로 돌아가기
            </button>
          ) : (
            <button className="dm-btn" onClick={() => navigate("/login")}>
              로그인하기
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
