import { forwardRef } from 'react';

const SearchBar = forwardRef(({ handleSearchButtonClick }, ref) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '20px',
      }}
    >
      <input
        type='text'
        placeholder='검색어 입력'
        ref={ref}
        style={{
          width: '200px',
          height: '42px',
          outline: 'none',
          border: 'none',
          borderBottom: '1px solid #8A8A8A',
        }}
      />
      <button
        style={{
          border: 'none',
          width: '80px',
          height: '42px',
          borderRadius: '6px',
          marginLeft: '20px',
          backgroundColor: '#8a8a8a',
          color: 'white',
          cursor: 'pointer',
        }}
        onClick={handleSearchButtonClick}
      >
        검색
      </button>
    </div>
  );
});

export default SearchBar;
