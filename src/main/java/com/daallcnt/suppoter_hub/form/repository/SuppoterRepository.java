package com.daallcnt.suppoter_hub.form.repository;

import com.daallcnt.suppoter_hub.form.entity.Suppoter;
import com.daallcnt.suppoter_hub.form.payload.DirectChildrenRankView;
import com.daallcnt.suppoter_hub.form.payload.MatchedSupporterView;
import com.daallcnt.suppoter_hub.form.payload.RecommendRankView;
import com.daallcnt.suppoter_hub.form.payload.RegionRowView;
import com.daallcnt.suppoter_hub.form.payload.SheetTreeRowView;
import com.daallcnt.suppoter_hub.form.payload.SuppoterNodeView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SuppoterRepository extends JpaRepository<Suppoter, Long> {
    List<Suppoter> findByName(String recommendName);


    List<Suppoter> findByPageNumberAndRecommenderIsNull(int pageNumber);

    @Query("SELECT DISTINCT pageNumber FROM Suppoter where pageNumber is not null order by pageNumber")
    List<Integer> findPageNumberAll();

    List<Suppoter> findByRecommendContaining(String keyword);
    
    List<Suppoter> findByRecommend(String recommend);

    boolean existsByPhone(String phone);

    List<Suppoter> findByRecommenderIsNullAndRecommendNot(String recommend);

    List<Suppoter> findByRecommenderIsNullAndRecommendIsNotNull();

    @Query(value = """
    WITH RECURSIVE
    down_tree AS (
      SELECT
        p.id  AS ancestor_id,
        c.id  AS descendant_id,
        CAST(CONCAT(p.id, ',', c.id) AS CHAR(2000)) AS path,
        1 AS depth
      FROM suppoter p
      JOIN suppoter c ON c.recommender_id = p.id
    
      UNION ALL
    
      SELECT
        dt.ancestor_id,
        c.id AS descendant_id,
        CONCAT(dt.path, ',', c.id) AS path,
        dt.depth + 1 AS depth
      FROM down_tree dt
      JOIN suppoter c ON c.recommender_id = dt.descendant_id
      WHERE dt.depth < 1000
        AND FIND_IN_SET(c.id, dt.path) = 0   -- 사이클 방지
    ),
    tot AS (
      SELECT ancestor_id AS id, COUNT(*) AS total_count
      FROM down_tree
      GROUP BY ancestor_id
    ),
    up_tree AS (
      SELECT
        s.id AS start_id,
        s.id AS current_id,
        s.recommender_id AS parent_id,
        CAST(s.id AS CHAR(2000)) AS path,
        0 AS depth
      FROM suppoter s
      JOIN tot ON tot.id = s.id
    
      UNION ALL
    
      SELECT
        ut.start_id,
        p.id AS current_id,
        p.recommender_id AS parent_id,
        CONCAT(ut.path, ',', p.id) AS path,
        ut.depth + 1 AS depth
      FROM up_tree ut
      JOIN suppoter p ON p.id = ut.parent_id
      WHERE ut.depth < 1000
        AND FIND_IN_SET(p.id, ut.path) = 0  
    ),
    
    roots AS (
      SELECT start_id, current_id AS root_id
      FROM up_tree
      WHERE parent_id IS NULL
    )
    
    SELECT
      CAST(ROW_NUMBER() OVER (ORDER BY tot.total_count DESC) AS SIGNED) AS ranking,
      s.id AS id,
      s.recommender_id AS recommender_id,
      s.name AS name,
      COALESCE(root.name, s.name) AS rootName,
      r.root_id AS root_id,
      tot.total_count AS recommendedCount,
      s.phone AS phone
    FROM tot
    JOIN suppoter s ON s.id = tot.id
    LEFT JOIN roots r ON r.start_id = s.id
    LEFT JOIN suppoter root ON root.id = r.root_id
    WHERE tot.total_count >= ?       
    ORDER BY tot.total_count DESC;
    """, nativeQuery = true)
    List<RecommendRankView> findRecommendersRankWithRoot(@Param("min") long min);

    /**
     * 직계자손(직접 추천한 사람) 수 기준 랭킹. 자식 수가 min 이상인 사람만.
     * recommendedCount 컬럼은 직계 자식 수(direct children count).
     */
    @Query(value = """
    WITH RECURSIVE direct_counts AS (
      SELECT recommender_id AS id, COUNT(*) AS direct_count
      FROM suppoter
      WHERE recommender_id IS NOT NULL
      GROUP BY recommender_id
      HAVING COUNT(*) >= :min
    ),
    up_tree AS (
      SELECT s.id AS start_id, s.id AS current_id, s.recommender_id AS parent_id, 0 AS depth
      FROM suppoter s
      JOIN direct_counts dc ON dc.id = s.id
      UNION ALL
      SELECT ut.start_id, p.id AS current_id, p.recommender_id AS parent_id, ut.depth + 1
      FROM up_tree ut
      JOIN suppoter p ON p.id = ut.parent_id
      WHERE ut.depth < 1000
    ),
    roots AS (
      SELECT start_id, current_id AS root_id FROM up_tree WHERE parent_id IS NULL
    )
    SELECT
      CAST(ROW_NUMBER() OVER (ORDER BY dc.direct_count DESC) AS SIGNED) AS ranking,
      s.id AS id,
      s.recommender_id AS recommender_id,
      s.name AS name,
      COALESCE(root.name, s.name) AS rootName,
      r.root_id AS root_id,
      dc.direct_count AS recommendedCount,
      s.phone AS phone
    FROM direct_counts dc
    JOIN suppoter s ON s.id = dc.id
    LEFT JOIN roots r ON r.start_id = s.id
    LEFT JOIN suppoter root ON root.id = r.root_id
    ORDER BY dc.direct_count DESC
    """, nativeQuery = true)
    List<DirectChildrenRankView> findDirectChildrenRankWithRoot(@Param("min") long min);

    long countByRecommenderIsNotNull();

    @Query("""
  select
    s.id as id,
    s.name as name,
    s.phone as phone,
    s.address as address,
    r.id as recommenderId
  from Suppoter s
  left join s.recommender r
  where (:region = '전체' or coalesce(s.address,'') like concat('%', :region, '%'))
    and (:keyword is null or trim(:keyword) = ''
         or s.name like concat('%', trim(:keyword), '%')
         or s.phone like concat('%', trim(:keyword), '%'))
""")
    Page<RegionRowView>  findByRegion(@Param("region") String region, @Param("keyword") String keyword, Pageable pageable);

    @Query("""
        select
            s.name as name,
            r.name as recommenderName,
            s.phone as phone,
            s.address as address
        from Suppoter s
        left join s.recommender r
        where s.isRightsMember is true
    """)
    List<RegionRowView> findRightsMembers();

    @Query("""
              select
                s.id as id,
                s.recommender.id as recommenderId,
                s.name as name
              from Suppoter s
              where s.id in :ids
            """)
    List<SuppoterNodeView> findNodesByIds(@Param("ids") List<Long> ids);

    @Query("""
              select
                s.id as id,
                s.name as name,
                s.address as address,
                s.phone as phone,
                r.name as recommenderName
              from Suppoter s
              left join s.recommender r
              where (:region = '전체' or coalesce(s.address,'') like concat('%', :region, '%'))
                and (:keyword is null or trim(:keyword) = ''
                     or s.name like concat('%', trim(:keyword), '%')
                     or s.phone like concat('%', trim(:keyword), '%'))
              order by s.id desc
            """)
    List<RegionRowView> findExcelBaseByRegionAndKeyword(
            @Param("region") String region,
            @Param("keyword") String keyword
    );

    /**
     * 대표(leader) 기준으로 하위 트리를 한 번에 조회한다.
     * - MySQL 8+ 재귀 CTE 사용
     * - path 컬럼으로 사이클 방지
     *
     * 주의: 대량 데이터에서 N+1(추천인 children lazy 로딩) 방지를 위해 사용한다.
     */
    @Query(value = """
        WITH RECURSIVE subtree AS (
          SELECT
            s.id AS id,
            s.recommender_id AS recommenderId,
            s.name AS name,
            s.phone AS phone,
            s.address AS address,
            s.recommend AS recommend,
            s.is_rights_member AS isRightsMember,
            CAST(s.id AS CHAR(2000)) AS path,
            0 AS depth
          FROM suppoter s
          WHERE s.id = :rootId

          UNION ALL

          SELECT
            c.id AS id,
            c.recommender_id AS recommenderId,
            c.name AS name,
            c.phone AS phone,
            c.address AS address,
            c.recommend AS recommend,
            c.is_rights_member AS isRightsMember,
            CONCAT(st.path, ',', c.id) AS path,
            st.depth + 1 AS depth
          FROM suppoter c
          JOIN subtree st ON c.recommender_id = st.id
          WHERE st.depth < 1000
            AND FIND_IN_SET(c.id, st.path) = 0
        )
        SELECT id, recommenderId, name, phone, address, recommend, isRightsMember, depth
        FROM subtree
        ORDER BY depth, id
        """, nativeQuery = true)
    List<SheetTreeRowView> findSheetSubtree(@Param("rootId") Long rootId);

    /**
     * 전화번호가 있는 Supporter의 id, name, phone만 조회.
     * 연락처 매칭 시 전체 트리 대신 경량 조회에 사용.
     */
    @Query("""
        SELECT new com.daallcnt.suppoter_hub.form.payload.MatchedSupporterView(s.id, s.name, s.phone)
        FROM Suppoter s
        WHERE s.phone IS NOT NULL AND LENGTH(TRIM(s.phone)) > 0
        """)
    List<MatchedSupporterView> findAllWithPhoneProjection();
}
