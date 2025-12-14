import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderNodeApi } from '../../apis/admin/adminApi.js';
import Xarrow, { Xwrapper } from 'react-xarrows';
import { useRef } from 'react';

const AdminLeaderTree = () => {
  const { leaderId } = useParams();

  const nodeRefs = useRef({});

  const { data } = useQuery({
    queryKey: 'leaderId',
    queryFn: () => fetchLeaderNodeApi({ leaderId: leaderId }),
  });

  return (
    <>
      {data && (
        <div style={{ marginTop: '35px', marginLeft: '45px' }}>
          <Xwrapper>
            <TreeNode
              key={data.id}
              node={data}
              // setIsInfoModalOpen={setIsInfoModalOpen}
              // setSelectedNode={setSelectedNode}
              // highlightedNodeId={highlightedNodeId}
              refs={nodeRefs.current}
            />
          </Xwrapper>
        </div>
      )}
    </>
  );
};

const TreeNode = ({
  node,
  highlightedNodeId,
  setIsInfoModalOpen,
  setSelectedNode,
  refs,
}) => {
  const navigate = useNavigate();
  const isHighlighted = node.id === highlightedNodeId;
  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      {/* 노드 UI */}
      <div
        id={`node-${node.id}`}
        ref={(el) => {
          if (el) refs[`node-${node.id}`] = el; // 3) 이 시점에 refs에 element가 등록됩니다
        }}
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
          marginBottom: '15px',
          cursor: 'pointer',
        }}
        onClick={() => {
          // setIsInfoModalOpen(true);
          // setSelectedNode(node);
          navigate(`/modifyInfo/${node.id}`);
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

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '50px',
        }}
      >
        {/* 자식 연결 */}
        {node.children?.map((child) => (
          <>
            <TreeNode
              key={child.id}
              node={child}
              setIsInfoModalOpen={setIsInfoModalOpen}
              setSelectedNode={setSelectedNode}
              highlightedNodeId={highlightedNodeId}
              refs={refs}
            />

            {/* 4) start/end props를 id 문자열로도 받을 수 있습니다 */}
            <Xarrow
              start={`node-${node.id}`}
              end={`node-${child.id}`}
              startAnchor={{ position: 'right', offset: { x: 0 } }}
              endAnchor={{ position: 'left', offset: { x: 0 } }}
              color='black'
              strokeWidth={1}
              path='grid'
            />
          </>
        ))}
      </div>
    </div>
  );
};

export default AdminLeaderTree;
