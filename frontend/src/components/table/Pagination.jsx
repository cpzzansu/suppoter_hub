const Pagination = ({ pageIndex, setPageIndex, pageCount }) => {
  const renderPageNumbers = () => {
    const delta = 2; // 현재 페이지 기준 앞뒤로 몇 개씩 보여줄지
    const pages = [];

    // 첫 페이지는 항상 보여줌 (0번 인덱스)
    pages.push(0);

    // 시작과 끝 계산 (0-based index)
    let start = Math.max(1, pageIndex - delta);
    let end = Math.min(pageCount - 2, pageIndex + delta);

    // 만약 시작이 1보다 크면 생략부호 표시
    if (start > 1) {
      pages.push('ellipsis-prev');
    }

    // 중간 페이지들 추가
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 마지막 페이지 (pageCount - 1)는 항상 보여줌
    if (end < pageCount - 2) {
      pages.push('ellipsis-next');
    }
    if (pageCount > 1) {
      pages.push(pageCount - 1);
    }

    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '20px',
      }}
    >
      <PaginationButton
        onClick={() => setPageIndex(0)}
        disabled={pageIndex === 0}
        buttonImagePath='/assets/admin/navi/button/left_left_arrow.png'
      />
      <PaginationButton
        onClick={() => setPageIndex(pageIndex - 1)}
        disabled={pageIndex === 0}
        buttonImagePath='/assets/admin/navi/button/left_arrow.png'
      />
      {renderPageNumbers().map((page, idx) => {
        if (page === 'ellipsis-prev' || page === 'ellipsis-next') {
          return (
            <span key={idx} style={{ margin: '0 5px' }}>
              ...
            </span>
          );
        }
        return (
          <button
            key={idx}
            onClick={() => setPageIndex(page)}
            style={
              page === pageIndex
                ? pagingButtonStyles.activeButton
                : pagingButtonStyles.unActiveButton
            }
          >
            {page + 1}
          </button>
        );
      })}
      <PaginationButton
        onClick={() => setPageIndex(pageIndex + 1)}
        disabled={pageIndex === pageCount - 1}
        buttonImagePath='/assets/admin/navi/button/right_arrow.png'
      />
      <PaginationButton
        onClick={() => setPageIndex(pageCount - 1)}
        disabled={pageIndex === pageCount - 1}
        buttonImagePath='/assets/admin/navi/button/right_right_arrow.png'
      />
    </div>
  );
};

const PaginationButton = ({ buttonImagePath, ...props }) => {
  return (
    <button
      {...props}
      style={{
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
      }}
    >
      <img style={{ width: '18px' }} src={buttonImagePath} alt='버튼 이미지' />
    </button>
  );
};

const pagingButtonStyles = {
  activeButton: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontWeight: '600',
    color: '#2267a9',
    cursor: 'pointer',
    margin: '0 5px',
  },
  unActiveButton: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    cursor: 'pointer',
    margin: '0 5px',
  },
};

export default Pagination;
