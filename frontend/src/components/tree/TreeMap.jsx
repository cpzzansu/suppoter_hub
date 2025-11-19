import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTreeMapApi } from '../../apis/admin/adminApi.js';
import { forwardRef, useRef, useState } from 'react';
import Xarrow, { Xwrapper } from 'react-xarrows';
import styles from './Tree.module.css';
import { formatFourDigits, formatPhoneNumber } from '../../utils/commonUtil.js';
import { checkModifyValue, validateForm } from '../../utils/validate.js';
import { modifyForm } from '../../apis/form/formApi.js';
import InfoModal from './InfoModal.jsx';
import { useNavigate } from 'react-router-dom';

// const TreeNode = ({
//   node,
//   highlightedNodeId,
//   setIsInfoModalOpen,
//   setSelectedNode,
//   refs,
// }) => {
//   const isHighlighted = node.id === highlightedNodeId;
//
//   return (
//     <div
//       id={`node-${node.id}`}
//       style={{ display: 'flex' }}
//       ref={(el) => {
//         if (el) refs[`node-${node.id}`] = el;
//       }}
//     >
//       <div
//         style={{ de
//           display: 'flex',
//           flexDirection: 'column',
//           justifyContent: 'center',
//           alignItems: 'center',
//           width: '169px',
//           height: '70px',
//           border: isHighlighted
//             ? '2px solid #FFCB00' // 하이라이트 테두리
//             : '1px solid #000',
//           backgroundColor: isHighlighted
//             ? 'rgba(255, 203, 0, 0.2)' // 하이라이트 배경
//             : 'transparent',
//           borderRadius: '5px',
//           fontSize: '20px',
//           fontWeight: 'semibold',
//           cursor: 'pointer',
//         }}
//         onClick={() => {
//           setIsInfoModalOpen(true);
//           setSelectedNode(node);
//         }}
//       >
//         {node.name}
//         <span style={{ fontSize: '18px', color: '#838383' }}>
//           {node.phone.slice(9)}
//           <span style={{ marginLeft: '5px', color: '#2DB384' }}>
//             ({node.totalDescendantCount})
//           </span>
//         </span>
//       </div>
//
//       {node.children && node.children.length > 0 && (
//         <div style={{ display: 'flex' }}>
//           <div
//             style={{
//               width: '25px',
//               height: '36px',
//               // borderBottom: '1px solid black',
//             }}
//           />
//           <div
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//             }}
//           >
//             {node.children.map((child, idx, arr) => {
//               const isFirst = idx === 0;
//               const isLast = idx === arr.length - 1;
//
//               return (
//                 <div
//                   style={{
//                     display: 'flex',
//                     alignItems: 'start',
//                   }}
//                 >
//                   <div
//                     style={{
//                       display: 'flex',
//                       // borderLeft: '1px solid black',
//                       height: '100px',
//                     }}
//                   >
//                     {/*{!isFirst && (*/}
//                     {/*  <div*/}
//                     {/*    style={{*/}
//                     {/*      borderLeft: '1px solid black',*/}
//                     {/*      height: '37px',*/}
//                     {/*      boxSizing: 'border-box',*/}
//                     {/*    }}*/}
//                     {/*  />*/}
//                     {/*)}*/}
//                     {/*{!isLast && (*/}
//                     {/*  <div*/}
//                     {/*    style={{*/}
//                     {/*      display: 'flex',*/}
//                     {/*      flexDirection: 'column',*/}
//                     {/*      alignItems: 'center',*/}
//                     {/*      position: !isFirst && !isLast && 'relative',*/}
//                     {/*      left: !isFirst && !isLast && '-1px',*/}
//                     {/*    }}*/}
//                     {/*  >*/}
//                     {/*    <div*/}
//                     {/*      style={{*/}
//                     {/*        height: '36px',*/}
//                     {/*        boxSizing: 'border-box',*/}
//                     {/*      }}*/}
//                     {/*    />*/}
//                     {/*    <div*/}
//                     {/*      style={{*/}
//                     {/*        borderLeft: '1px solid black',*/}
//                     {/*        height: '52px',*/}
//                     {/*        boxSizing: 'border-box',*/}
//                     {/*      }}*/}
//                     {/*    />*/}
//                     {/*  </div>*/}
//                     {/*)}*/}
//                   </div>
//
//                   <div
//                     style={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       position: 'relative',
//                     }}
//                   >
//                     <div
//                       style={{
//                         position: 'absolute',
//                         top: '36px',
//                         left: '0px',
//                         width: '25px',
//                         // borderTop: '1px solid black',
//                       }}
//                     />
//                     <div style={{ width: '25px' }} />
//                     <TreeNode
//                       key={child.id}
//                       node={child}
//                       setIsInfoModalOpen={setIsInfoModalOpen}
//                       setSelectedNode={setSelectedNode}
//                       refs={refs}
//                     />
//                     <Xarrow
//                       start={`node-${node.id}`}
//                       end={`node-${child.id}`}
//                       color='black'
//                       strokeWidth={2}
//                       path='grid'
//                     />
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

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

const TreeMap = ({ currentPage }) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [searchName, setSearchName] = useState('');

  const nodeRefs = useRef({});
  const formRefs = useRef({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['fetchTreeMap', currentPage],
    queryFn: () => fetchTreeMapApi({ currentPage }),
  });

  const queryClient = useQueryClient();

  const modifyMutation = useMutation({
    mutationFn: modifyForm,
    onSuccess: (data) => {
      alert('수정되었습니다.');
      setIsInfoModalOpen(false);
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      console.error('등록중 에러가 발생했습니다.', err);
    },
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
      <Xwrapper>
        {data &&
          data.map((data) => (
            <>
              <TreeNode
                key={data.id}
                node={data}
                setIsInfoModalOpen={setIsInfoModalOpen}
                setSelectedNode={setSelectedNode}
                highlightedNodeId={highlightedNodeId}
                refs={nodeRefs.current}
              />
            </>
          ))}
      </Xwrapper>
      {isInfoModalOpen && (
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
        >
          <ModalValueContainer>
            <ModalLabel>이름</ModalLabel>
            <ModalInput
              defaultValue={selectedNode.name}
              ref={(el) => {
                formRefs.current['name'] = el;
              }}
            />
          </ModalValueContainer>
          <ModalValueContainer>
            <ModalLabel>폰번호</ModalLabel>
            <ModalInput
              defaultValue={selectedNode.phone}
              ref={(el) => {
                formRefs.current['phone'] = el;
              }}
              onInput={(e) =>
                (e.target.value = formatPhoneNumber(e.target.value))
              }
            />
          </ModalValueContainer>
          <ModalValueContainer>
            <ModalLabel>주소</ModalLabel>
            <ModalInput
              defaultValue={selectedNode.address}
              ref={(el) => {
                formRefs.current['address'] = el;
              }}
            />
          </ModalValueContainer>
          <ModalValueContainer>
            <ModalLabel>추천인 성명</ModalLabel>
            <ModalInput
              defaultValue={selectedNode.recommend}
              ref={(el) => {
                formRefs.current['recommend'] = el;
              }}
            />
          </ModalValueContainer>
          <ModalValueContainer>
            <ModalLabel>추천인 코드</ModalLabel>
            <ModalInput
              defaultValue={selectedNode.recommendPhone}
              ref={(el) => {
                formRefs.current['recommendPhone'] = el;
              }}
              onInput={(e) =>
                (e.target.value = formatFourDigits(e.target.value))
              }
            />
          </ModalValueContainer>
          <ModalValueContainer>
            <ModalLabel>추천인 수</ModalLabel>
            <ModalInput
              defaultValue={selectedNode.totalDescendantCount}
              ref={(el) => (formRefs.current['totalDescendantCount'] = el)}
            />
          </ModalValueContainer>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '1px solid black',
                fontSize: '18px',
                marginTop: '20px',
                cursor: 'pointer',
                color: 'black',
              }}
              onClick={() => setIsInfoModalOpen(false)}
            >
              취소
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '1px solid black',
                fontSize: '18px',
                marginTop: '20px',
                cursor: 'pointer',
                color: 'black',
              }}
              onClick={() => {
                const formData = {
                  id: selectedNode.id,
                  name: formRefs.current['name'].value,
                  phone: formRefs.current['phone'].value,
                  address: formRefs.current['address'].value,
                  recommend: formRefs.current['recommend'].value,
                  recommendPhone: formRefs.current['recommendPhone'].value,
                };

                const valueEqual = checkModifyValue({
                  formData,
                  selectedNode,
                });

                if (valueEqual) return;

                const isValid = validateForm(formData, true);
                if (!isValid) return;

                modifyMutation.mutate({ formData });
              }}
            >
              수정
            </button>
          </div>
        </InfoModal>
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

const ModalInput = forwardRef(({ ...props }, ref) => {
  return <input {...props} ref={ref} />;
});

export default TreeMap;
