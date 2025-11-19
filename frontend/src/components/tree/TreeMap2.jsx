import { useQuery } from '@tanstack/react-query';
import { fetchTreeMapApi } from '../../apis/admin/adminApi.js';
import { useState } from 'react';
import styles from './Tree.module.css';

const TreeNode = ({
  node,
  highlightedNodeId,
  setIsInfoModalOpen,
  setSelectedNode,
}) => {
  const isHighlighted = node.id === highlightedNodeId;
  return (
    <div id={`node-${node.id}`} style={{ display: 'flex' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '169px',
          height: '70px',
          border: isHighlighted
            ? '2px solid #FFCB00' // 하이라이트 테두리
            : '1px solid #000',
          backgroundColor: isHighlighted
            ? 'rgba(255, 203, 0, 0.2)' // 하이라이트 배경
            : 'transparent',
          borderRadius: '5px',
          fontSize: '20px',
          fontWeight: 'semibold',
          cursor: 'pointer',
        }}
        onClick={() => {
          setIsInfoModalOpen(true);
          setSelectedNode(node);
        }}
      >
        {node.name}
        <span style={{ fontSize: '18px', color: '#838383' }}>
          {node.phone.slice(9)}
          <span style={{ marginLeft: '5px', color: '#2DB384' }}>
            ({node.totalDescendantCount})
          </span>
        </span>
      </div>

      {node.children && node.children.length > 0 && (
        <div style={{ display: 'flex' }}>
          <div
            style={{
              width: '25px',
              height: '36px',
              borderBottom: '1px solid black',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {node.children.map((child, idx, arr) => {
              const isFirst = idx === 0;
              const isLast = idx === arr.length - 1;

              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      borderLeft: '1px solid black',
                      height: '100px',
                    }}
                  >
                    {/*{!isFirst && (*/}
                    {/*  <div*/}
                    {/*    style={{*/}
                    {/*      borderLeft: '1px solid black',*/}
                    {/*      height: '37px',*/}
                    {/*      boxSizing: 'border-box',*/}
                    {/*    }}*/}
                    {/*  />*/}
                    {/*)}*/}
                    {/*{!isLast && (*/}
                    {/*  <div*/}
                    {/*    style={{*/}
                    {/*      display: 'flex',*/}
                    {/*      flexDirection: 'column',*/}
                    {/*      alignItems: 'center',*/}
                    {/*      position: !isFirst && !isLast && 'relative',*/}
                    {/*      left: !isFirst && !isLast && '-1px',*/}
                    {/*    }}*/}
                    {/*  >*/}
                    {/*    <div*/}
                    {/*      style={{*/}
                    {/*        height: '36px',*/}
                    {/*        boxSizing: 'border-box',*/}
                    {/*      }}*/}
                    {/*    />*/}
                    {/*    <div*/}
                    {/*      style={{*/}
                    {/*        borderLeft: '1px solid black',*/}
                    {/*        height: '52px',*/}
                    {/*        boxSizing: 'border-box',*/}
                    {/*      }}*/}
                    {/*    />*/}
                    {/*  </div>*/}
                    {/*)}*/}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '36px',
                        left: '0px',
                        width: '25px',
                        borderTop: '1px solid black',
                      }}
                    />
                    <div style={{ width: '25px' }} />
                    <TreeNode
                      key={child.id}
                      node={child}
                      setIsInfoModalOpen={setIsInfoModalOpen}
                      setSelectedNode={setSelectedNode}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TreeMap = ({ currentPage }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [searchName, setSearchName] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['fetchTreeMap', currentPage],
    queryFn: () => fetchTreeMapApi({ currentPage }),
  });

  const findNodeByName = (nodes, name) => {
    for (const node of nodes) {
      if (node.name.trim() === name.trim()) {
        return node;
      }
      if (node.children) {
        const found = findNodeByName(node.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const onSearch = () => {
    if (!data) return;

    const target = findNodeByName(data, searchName);
    if (!target) {
      return alert('해당 이름을 찾을 수 없습니다.');
    }

    setHighlightedNodeId(target.id);

    // id가 `node-${target.id}` 로 붙어 있다는 가정
    const el = document.getElementById(`node-${target.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0' }}>
        <div>검색 : </div>
        <input
          style={{
            margin: '0 10px',
            padding: '0 10px',
            height: '30px',
            width: '300px',
            borderRadius: '7px',
            border: '1px solid black',
            boxSizing: 'border-box',
          }}
          type='text'
          placeholder={'이름을 입력하세요.'}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button
          style={{
            height: '31px',
            width: '70px',
            borderRadius: '7px',
            border: '1px solid black',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
          onClick={onSearch}
        >
          찾기
        </button>
      </div>
      {data &&
        data.map((data) => (
          <>
            <TreeNode
              key={data.id}
              node={data}
              setIsInfoModalOpen={setIsInfoModalOpen}
              setSelectedNode={setSelectedNode}
              highlightedNodeId={highlightedNodeId}
            />
            <div style={{ height: '15px' }} />
          </>
        ))}
      {isInfoModalOpen && (
        <div className={styles.modal} onClick={() => setIsInfoModalOpen(false)}>
          <div
            className={styles.container}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalValueContainer>
              <ModalLabel>이름</ModalLabel>
              <ModalValue>{selectedNode.name}</ModalValue>
            </ModalValueContainer>
            <ModalValueContainer>
              <ModalLabel>폰번호</ModalLabel>
              <ModalValue>{selectedNode.phone}</ModalValue>
            </ModalValueContainer>
            <ModalValueContainer>
              <ModalLabel>주소</ModalLabel>
              <ModalValue>{selectedNode.address}</ModalValue>
            </ModalValueContainer>
            <ModalValueContainer>
              <ModalLabel>추천인 성명</ModalLabel>
              <ModalValue>{selectedNode.recommend}</ModalValue>
            </ModalValueContainer>
            <ModalValueContainer>
              <ModalLabel>추천인 코드</ModalLabel>
              <ModalValue>{selectedNode.recommendPhone}</ModalValue>
            </ModalValueContainer>
            <ModalValueContainer>
              <ModalLabel>추천인 수</ModalLabel>
              <ModalValue>{selectedNode.totalDescendantCount}</ModalValue>
            </ModalValueContainer>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  borderRadius: '5px',
                  fontSize: '18px',
                  marginTop: '20px',
                  cursor: 'pointer',
                }}
                onClick={() => setIsInfoModalOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ModalValueContainer = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
    {children}
  </div>
);

const ModalLabel = ({ children }) => (
  <div style={{ width: '120px', fontSize: '20px', fontWeight: 600 }}>
    {children}
  </div>
);

const ModalValue = ({ children }) => (
  <div style={{ fontSize: '20px' }}>{children}</div>
);

export default TreeMap;
